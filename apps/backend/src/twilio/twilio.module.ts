import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TwilioService } from './twilio.service';
import { TwilioWebhookGuard } from './twilio-webhook.guard';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    }),
  ],
  providers: [
    TwilioService,
    TwilioWebhookGuard,
    NotificationService,
    NotificationProcessor,
  ],
  exports: [
    TwilioService,
    TwilioWebhookGuard,
    NotificationService,
    NotificationProcessor,
    BullModule,
  ],
})
export class TwilioModule {}
