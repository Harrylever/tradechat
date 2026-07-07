import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private client: twilio.Twilio | null = null;
  private fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER');

    if (from) {
      this.fromNumber = from.startsWith('whatsapp:')
        ? from
        : `whatsapp:${from}`;
    } else {
      throw new Error('TWILIO_WHATSAPP_NUMBER missing!');
    }

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
    } else {
      this.logger.warn(
        'Twilio credentials missing. WhatsApp sending will log to console.',
        'TwilioService',
      );
    }
  }

  async sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    this.logger.log(
      `Sending WhatsApp message to ${formattedTo}:\n"${message}"`,
      'TwilioService',
    );

    if (!this.client) {
      this.logger.log(
        `[MOCK TWILIO SEND] To: ${formattedTo} | Body: ${message}`,
        'TwilioService',
      );
      return true;
    }

    try {
      const result = await this.client.messages.create({
        from: this.fromNumber,
        to: formattedTo,
        body: message,
      });
      this.logger.log(
        `Twilio message sent successfully: SID ${result.sid}`,
        'TwilioService',
      );
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to send WhatsApp message to ${formattedTo}: ${error.message}`,
        error.stack,
        'TwilioService',
      );
      return false;
    }
  }
}
