import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as Sentry from '@sentry/nestjs';
import { WhatsAppService } from './whatsapp.service';

@Processor('whatsapp-messages')
export class WhatsAppProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsAppProcessor.name);

  constructor(private readonly whatsappService: WhatsAppService) {
    super();
  }

  async process(job: Job<{ from: string; text: string }>): Promise<void> {
    const { from, text } = job.data;
    this.logger.debug(`Processing message job ${job.id} from ${from}`);

    try {
      await this.whatsappService.handleIncomingMessage(from, text);
    } catch (error: any) {
      this.logger.error(
        `Failed message job ${job.id} from ${from}: ${error.message}`,
        error.stack,
      );
      Sentry.captureException(error, {
        tags: { queue: 'whatsapp-messages', jobId: job.id },
        extra: { from, text },
      });
      throw error;
    }
  }
}
