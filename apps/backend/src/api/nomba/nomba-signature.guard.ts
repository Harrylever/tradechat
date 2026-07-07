import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';

interface NombaWebhookPayload {
  event_type?: string;
  requestId?: string;
  data?: {
    merchant?: {
      userId?: string;
      walletId?: string;
    };
    transaction?: {
      transactionId?: string;
      type?: string;
      time?: string;
      responseCode?: string;
    };
  };
}

@Injectable()
export class NombaSignatureGuard implements CanActivate {
  private readonly logger = new Logger(NombaSignatureGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = this.configService.get<string>('NOMBA_WEBHOOK_SECRET');

    if (!secret) {
      this.logger.warn(
        'NOMBA_WEBHOOK_SECRET not set. Skipping HMAC verification.',
        'NombaSignatureGuard',
      );
      return true;
    }

    const signatureHeader = request.headers['nomba-signature'];
    const timestampHeader = request.headers['nomba-timestamp'];

    if (!signatureHeader || typeof signatureHeader !== 'string') {
      this.logger.error(
        'Missing nomba-signature header in webhook request',
        'NombaSignatureGuard',
      );
      throw new UnauthorizedException('Missing webhook signature header');
    }

    if (!timestampHeader || typeof timestampHeader !== 'string') {
      this.logger.error(
        'Missing nomba-timestamp header in webhook request',
        'NombaSignatureGuard',
      );
      throw new UnauthorizedException('Missing webhook timestamp header');
    }

    const body = request.body as NombaWebhookPayload;

    const expectedSignature = this.generateSignature(
      body,
      secret,
      timestampHeader,
    );

    const receivedBuffer = Buffer.from(signatureHeader, 'base64');
    const expectedBuffer = Buffer.from(expectedSignature, 'base64');

    const isValid =
      receivedBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(receivedBuffer, expectedBuffer);

    if (!isValid) {
      this.logger.error(
        `Webhook signature mismatch. Expected:${expectedSignature} Got:${signatureHeader}`,
        'NombaSignatureGuard',
      );
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }

  private generateSignature(
    body: NombaWebhookPayload,
    secret: string,
    timestamp: string,
  ): string {
    const eventType = body?.event_type ?? '';
    const requestId = body?.requestId ?? '';
    const userId = body?.data?.merchant?.userId ?? '';
    const walletId = body?.data?.merchant?.walletId ?? '';
    const transactionId = body?.data?.transaction?.transactionId ?? '';
    const transactionType = body?.data?.transaction?.type ?? '';
    const transactionTime = body?.data?.transaction?.time ?? '';

    let responseCode = body?.data?.transaction?.responseCode ?? '';

    if (responseCode === 'null') {
      responseCode = '';
    }

    const hashingPayload = [
      eventType,
      requestId,
      userId,
      walletId,
      transactionId,
      transactionType,
      transactionTime,
      responseCode,
      timestamp,
    ].join(':');

    return crypto
      .createHmac('sha256', secret)
      .update(hashingPayload)
      .digest('base64');
  }
}
