import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {}

  async sendWhatsApp(to: string, message: string): Promise<void> {
    try {
      await this.notificationQueue.add(
        'send-whatsapp',
        { to, message },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
      this.logger.debug(`Enqueued WhatsApp notification for ${to}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to enqueue WhatsApp notification for ${to}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
