import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { TwilioWebhookGuard } from '../../twilio/twilio-webhook.guard';

@ApiTags('Webhooks - Twilio WhatsApp')
@Controller('webhook/twilio')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(private readonly whatsappService: WhatsAppService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(TwilioWebhookGuard)
  @ApiOperation({
    summary: 'Receive incoming WhatsApp messages via Twilio webhook',
  })
  async handleIncoming(@Body() body: any) {
    const from = (body?.From || body?.from || '') as string;
    const text = (body?.Body || body?.body || '') as string;

    this.logger.log(
      `Incoming Twilio Webhook from:${from} text:${text}`,
      'WhatsAppController',
    );

    if (from && text) {
      // Process asynchronously without blocking Twilio's HTTP response
      await this.whatsappService
        .handleIncomingMessage(from, text)
        .catch((err) => {
          this.logger.error(
            `Error processing WhatsApp message: ${err.message}`,
            err.stack,
            'WhatsAppController',
          );
        });
    }

    // Twilio expects 200 OK or TwiML XML
    return '<Response></Response>';
  }
}
