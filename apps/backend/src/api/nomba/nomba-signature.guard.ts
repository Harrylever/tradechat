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

@Injectable()
export class NombaSignatureGuard implements CanActivate {
  private readonly logger = new Logger(NombaSignatureGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { rawBody?: Buffer }>();
    const secret = this.configService.get<string>('NOMBA_WEBHOOK_SECRET');

    // If secret is not configured in local dev, allow pass-through with warning
    if (!secret) {
      this.logger.warn(
        'NOMBA_WEBHOOK_SECRET not set. Skipping HMAC verification.',
        'NombaSignatureGuard',
      );
      return true;
    }

    const signatureHeader =
      request.headers['nomba-signature'] || request.headers['Nomba-Signature'];
    if (!signatureHeader || typeof signatureHeader !== 'string') {
      this.logger.error(
        'Missing nomba-signature header in webhook request',
        'NombaSignatureGuard',
      );
      throw new UnauthorizedException('Missing webhook signature header');
    }

    const payload = request.rawBody
      ? request.rawBody.toString('utf8')
      : JSON.stringify(request.body);

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signatureHeader),
        Buffer.from(expectedSignature),
      )
    ) {
      this.logger.error(
        `Webhook signature mismatch. Expected:${expectedSignature} Got:${signatureHeader}`,
        'NombaSignatureGuard',
      );
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }
}
