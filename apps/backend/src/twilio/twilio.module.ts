import { Module } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { TwilioWebhookGuard } from './twilio-webhook.guard';

@Module({
  providers: [TwilioService, TwilioWebhookGuard],
  exports: [TwilioService, TwilioWebhookGuard],
})
export class TwilioModule {}
