import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { NOMBA_API_URL } from '../../common/constants';
import { ENV } from 'src/config/env.config';

export interface CheckoutOrderPayload {
  amountNaira: number;
  orderReference: string;
  callbackUrl: string;
  customerId: string;
  customerEmail?: string;
}

export interface VirtualAccountPayload {
  accountRef: string;
  accountName: string;
  currency?: string;
}

@Injectable()
export class NombaService {
  private readonly logger = new Logger(NombaService.name);
  private readonly axiosInstance: AxiosInstance;
  private cachedAccessToken: string | null = null;
  private cachedRefreshToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly configService: ConfigService) {
    this.axiosInstance = axios.create({
      baseURL: NOMBA_API_URL,
      timeout: 15000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use(async (config) => {
      if (!config.url?.includes('/auth/token')) {
        const token = await this.getAccessToken();
        config.headers['Authorization'] = `Bearer ${token}`;
        config.headers['Content-Type'] = 'application/json';
        const accountId = this.configService.get<string>('NOMBA_ACCOUNT_ID');
        if (accountId) {
          config.headers['accountId'] = accountId;
        }
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Log all responses with structured merchantTxRef if present
        // const ref = response.config.data
        //   ? this.extractRef(response.config.data)
        //   : 'N/A';
        this.logger.log(
          `Nomba API Response [${response.config.method?.toUpperCase()} ${response.config.url}]: Code ${response.data?.code}`,
          'NombaService',
        );
        return response;
      },
      (error) => {
        const ref = error.config?.data
          ? this.extractRef(error.config.data)
          : 'N/A';
        this.logger.error(
          `Nomba API Error [${error.config?.method?.toUpperCase()} ${error.config?.url}] ref:${ref} - ${error.message}`,
          error.response?.data
            ? JSON.stringify(error.response.data)
            : error.stack,
          'NombaService',
        );
        throw new HttpException(
          error.response?.data?.description || 'Nomba API Request Failed',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      },
    );
  }

  private extractRef(data: any): string {
    try {
      if (typeof data === 'string') data = JSON.parse(data);
      return data?.order?.orderReference || data?.accountRef || 'N/A';
    } catch {
      return 'N/A';
    }
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    // Refresh proactively if within 5 minutes of expiration
    if (this.cachedAccessToken && this.tokenExpiresAt > now + 5 * 60 * 1000) {
      return this.cachedAccessToken;
    }

    try {
      const clientId = this.configService.get<string>('NOMBA_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'NOMBA_CLIENT_SECRET',
      );
      const accountId = this.configService.get<string>('NOMBA_ACCOUNT_ID');

      if (!clientId || !clientSecret || !accountId) {
        this.logger.warn(
          'Nomba credentials missing in environment. Returning mock token for testing.',
          'NombaService',
        );
        return 'mock_nomba_access_token';
      }

      const response = await axios.post(
        `${NOMBA_API_URL}/auth/token/issue`,
        {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        },
        {
          headers: { 'Content-Type': 'application/json', accountId },
        },
      );

      if (
        response.data?.code === '00' ||
        response.data?.access_token ||
        response.data?.data?.access_token
      ) {
        const tokenData = response.data?.data || response.data;
        this.cachedAccessToken = tokenData.access_token;
        this.cachedRefreshToken = tokenData.refresh_token;
        const expiresInSeconds = tokenData.expires_in || 3600;
        this.tokenExpiresAt = now + expiresInSeconds * 1000;
        return this.cachedAccessToken as string;
      }

      throw new Error(`Auth failed with code: ${response.data?.code}`);
    } catch (err: any) {
      this.logger.error(
        `Failed to fetch Nomba token: ${err.message}`,
        err.stack,
        'NombaService',
      );
      throw new HttpException(
        'Unable to authenticate with payment gateway',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async createCheckoutOrder(
    payload: CheckoutOrderPayload,
  ): Promise<{ checkoutLink: string; orderReference: string }> {
    const amountNaira = Number(payload.amountNaira.toFixed(2));
    const subAccountId = ENV.NOMBA_SUBACCOUNT_ID;

    if (!subAccountId) {
      throw new BadRequestException('Missing Nomba subaccount id');
    }

    const defaultEmail = ENV.NOMBA_DEFAULT_EMAIL;

    const requestBody = {
      order: {
        callbackUrl: payload.callbackUrl,
        amount: amountNaira,
        currency: 'NGN',
        orderReference: payload.orderReference,
        customerId: payload.customerId,
        customerEmail: payload.customerEmail || defaultEmail,
        ...(subAccountId && { accountId: subAccountId }),
      },
    };

    this.logger.log(
      `Creating Nomba checkout order ref:${payload.orderReference} amountNaira:${amountNaira} accountId:${subAccountId || 'default'}`,
      'NombaService',
    );

    const response = await this.axiosInstance.post(
      '/checkout/order',
      requestBody,
    );
    const data = response.data?.data || response.data;

    return {
      checkoutLink: data?.checkoutLink || data?.checkoutUrl || '',
      orderReference: data?.orderReference || payload.orderReference,
    };
  }

  async createVirtualAccount(payload: VirtualAccountPayload): Promise<any> {
    const requestBody = {
      accountRef: payload.accountRef,
      accountName: payload.accountName,
      currency: payload.currency || 'NGN',
    };

    const subAccountId = ENV.NOMBA_SUBACCOUNT_ID;

    if (!subAccountId) {
      throw new BadRequestException('Missing Nomba subaccount id');
    }

    const endpoint = `/accounts/virtual/${subAccountId}`;

    this.logger.log(
      `Creating Nomba virtual account ref:${payload.accountRef} name:${payload.accountName} endpoint:${endpoint}`,
      'NombaService',
    );

    const response = await this.axiosInstance.post(endpoint, requestBody);
    return response.data?.data || response.data;
  }

  async verifyTransaction(
    orderReference: string,
  ): Promise<{ isPaid: boolean; isFailed: boolean; raw: any }> {
    this.logger.log(
      `Verifying transaction status ref:${orderReference}`,
      'NombaService',
    );
    try {
      const response = await this.axiosInstance.post(
        '/checkout/confirm-transaction-receipt',
        { orderReference },
      );

      const data = response.data?.data || response.data;

      this.logger.debug(
        `Raw verifyTransaction response for ${orderReference}: ${JSON.stringify(data)}`,
        'NombaService',
      );

      const statusVal = data?.status;
      const isPaid = statusVal === true || statusVal === 'true';
      const isFailed = statusVal === false || statusVal === 'false';

      return {
        isPaid,
        isFailed,
        raw: data,
      };
    } catch (error: any) {
      this.logger.error(
        `Error verifying transaction ${orderReference}: ${error?.message}`,
        error?.stack,
        'NombaService',
      );
      return {
        isPaid: false,
        isFailed: false,
        raw: error?.response?.data || { error: error?.message },
      };
    }
  }

  async lookupBank(accountNumber: string, bankCode: string): Promise<any> {
    this.logger.log(
      `Looking up bank account ${accountNumber} (${bankCode})`,
      'NombaService',
    );
    const response = await this.axiosInstance.post('/transfers/bank/lookup', {
      accountNumber,
      bankCode,
    });
    return response.data?.data || response.data;
  }
}
