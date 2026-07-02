import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import twilio from 'twilio';

@Injectable()
export class TwilioWebhookGuard implements CanActivate {
  private readonly logger = new Logger(TwilioWebhookGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';

    if (!authToken || !isProd) {
      // Allow local development testing without twilio signature
      return true;
    }

    const twilioSignature = request.headers['x-twilio-signature'] as string;
    if (!twilioSignature) {
      this.logger.error(
        'Missing X-Twilio-Signature header',
        'TwilioWebhookGuard',
      );
      throw new UnauthorizedException('Missing Twilio webhook signature');
    }

    const url = `${request.protocol}://${request.get('host')}${request.originalUrl}`;
    const params = request.body || {};

    const isValid = twilio.validateRequest(
      authToken,
      twilioSignature,
      url,
      params,
    );
    if (!isValid) {
      this.logger.error(
        `Invalid Twilio webhook signature for URL ${url}`,
        'TwilioWebhookGuard',
      );
      throw new UnauthorizedException('Invalid Twilio signature');
    }

    return true;
  }
}
