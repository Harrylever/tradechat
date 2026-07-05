import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as Sentry from '@sentry/nestjs';
import { PrismaService } from '../prisma/prisma.service';
import { NombaService } from '../api/nomba/nomba.service';
import { NotificationService } from '../twilio/notification.service';

@Processor('reconciliation')
export class ReconciliationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReconciliationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nombaService: NombaService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<{ txId: string; ref: string }>): Promise<void> {
    const { txId, ref } = job.data;
    this.logger.debug(
      `Processing reconciliation job ${job.id} for tx ${txId} (${ref})`,
    );

    const tx = await this.prisma.transaction.findUnique({
      where: { id: txId },
      include: { merchant: true },
    });

    if (!tx || tx.status !== 'AWAITING_PAYMENT') {
      this.logger.debug(
        `Tx ${txId} is no longer in AWAITING_PAYMENT state (status: ${tx?.status}). Skipping.`,
      );
      return;
    }

    try {
      const result = await this.nombaService.verifyTransaction(ref);

      if (result.isPaid) {
        const { count } = await this.prisma.transaction.updateMany({
          where: { id: txId, status: 'AWAITING_PAYMENT' },
          data: { status: 'PAID', paidAt: new Date() },
        });

        if (count === 0) {
          this.logger.log(
            `Reconciler skipped tx ${txId} — already updated by webhook`,
            'ReconciliationProcessor',
          );
          return;
        }

        this.logger.log(
          `Reconciled missed webhook for tx ${txId} (${ref}) → PAID`,
          'ReconciliationProcessor',
        );

        await this.prisma.webhookEvent.create({
          data: {
            source: 'NOMBA',
            payload: result.raw ?? {},
            idempotencyKey: `reconcile-paid-${txId}`,
            transactionId: txId,
            merchantId: tx.merchantId,
          },
        });

        if (tx.merchant) {
          const merchantWhatsappNumber = tx.merchant.whatsappNumber;
          try {
            await this.notificationService.sendWhatsApp(
              merchantWhatsappNumber,
              `🎉 Payment Confirmed!\n\n📦 Item: ${tx.quantity}x ${tx.itemDescription}\n💰 Amount: ₦${Number(tx.totalAmount).toLocaleString()}\nRef: ${ref}`,
            );
          } catch (notifyErr: any) {
            this.logger.error(
              `Failed to enqueue merchant notification for tx ${txId}: ${notifyErr.message}`,
              notifyErr.stack,
            );
          }
        }
      } else if (result.isFailed) {
        await this.prisma.transaction.updateMany({
          where: { id: txId, status: 'AWAITING_PAYMENT' },
          data: { status: 'FAILED' },
        });

        await this.prisma.webhookEvent.create({
          data: {
            source: 'NOMBA',
            payload: result.raw ?? {},
            idempotencyKey: `reconcile-failed-${txId}`,
            transactionId: txId,
            merchantId: tx.merchantId,
          },
        });

        this.logger.log(
          `Reconciled expired/failed tx ${txId} (${ref}) → FAILED`,
          'ReconciliationProcessor',
        );
      }
    } catch (err: any) {
      this.logger.error(
        `Error verifying tx ${txId} (${ref}): ${err.message}`,
        err.stack,
      );
      Sentry.captureException(err, {
        tags: { queue: 'reconciliation', jobId: job.id },
        extra: { txId, ref },
      });
      throw err;
    }
  }
}
