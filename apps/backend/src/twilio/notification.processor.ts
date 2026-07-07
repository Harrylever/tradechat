import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as Sentry from '@sentry/nestjs';
import { TwilioService } from './twilio.service';

@Processor('notifications', {
  limiter: {
    max: 10,
    duration: 1000,
  },
})
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly twilioService: TwilioService) {
    super();
  }

  async process(job: Job<{ to: string; message: string }>): Promise<boolean> {
    const { to, message } = job.data;
    this.logger.debug(`Processing notification job ${job.id} for ${to}`);

    try {
      const success = await this.twilioService.sendWhatsAppMessage(to, message);
      if (!success) {
        throw new Error(`TwilioService returned false for ${to}`);
      }
      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed notification job ${job.id} for ${to}: ${error.message}`,
        error.stack,
      );
      Sentry.captureException(error, {
        tags: { queue: 'notifications', jobId: job.id },
        extra: { to },
      });
      throw error;
    }
  }
}
