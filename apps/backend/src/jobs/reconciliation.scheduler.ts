import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NombaService } from '../api/nomba/nomba.service';
import { TwilioService } from '../twilio/twilio.service';

@Injectable()
export class ReconciliationScheduler {
  private readonly logger = new Logger(ReconciliationScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nombaService: NombaService,
    private readonly twilio: TwilioService,
  ) {}

  // Force FAILED on any AWAITING_PAYMENT transaction older than 48 hours
  // This runs every hour to clean up long-tail stuck transactions
  @Cron('0 * * * *', {
    name: 'terminal-cutoff',
    timeZone: 'Africa/Lagos',
  })
  async runTerminalCutoff() {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const { count } = await this.prisma.transaction.updateMany({
      where: {
        status: 'AWAITING_PAYMENT',
        merchantTxRef: { not: null },
        createdAt: { lte: fortyEightHoursAgo },
      },
      data: { status: 'FAILED' },
    });
    if (count > 0) {
      this.logger.warn(
        `Terminal cutoff: force-failed ${count} transaction(s) older than 48 hours still in AWAITING_PAYMENT`,
        'ReconciliationScheduler',
      );
    }
  }

  // Run every 15 minutes
  @Cron('*/15 * * * *', {
    name: 'periodic-reconciliation',
    timeZone: 'Africa/Lagos',
  })
  async runPeriodicReconciliation() {
    this.logger.log(
      'Starting periodic Nomba reconciliation...',
      'ReconciliationScheduler',
    );

    try {
      // Query AWAITING_PAYMENT — these have a merchantTxRef
      // Only target transactions older than 1 hour to give the normal webhook time to fire first
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const pendingTx = await this.prisma.transaction.findMany({
        where: {
          status: 'AWAITING_PAYMENT',
          merchantTxRef: { not: null },
          createdAt: { lte: oneHourAgo },
        },
        include: { merchant: true },
        take: 50,
      });

      // Warn if backlog may exceed page size
      if (pendingTx.length === 50) {
        this.logger.warn(
          'Reconciliation query returned max page size (50) — backlog may exist beyond this batch.',
          'ReconciliationScheduler',
        );
      }

      this.logger.log(
        `Found ${pendingTx.length} AWAITING_PAYMENT transaction(s) to verify against Nomba API`,
        'ReconciliationScheduler',
      );

      for (const tx of pendingTx) {
        if (!tx.merchantTxRef) continue;

        try {
          const result = await this.nombaService.verifyTransaction(
            tx.merchantTxRef,
          );

          if (result.isPaid) {
            const { count } = await this.prisma.transaction.updateMany({
              where: { id: tx.id, status: 'AWAITING_PAYMENT' },
              data: { status: 'PAID', paidAt: new Date() },
            });

            if (count === 0) {
              // Webhook won the race — skip notification, already handled
              this.logger.log(
                `Reconciler skipped tx ${tx.id} — already updated by webhook`,
                'ReconciliationScheduler',
              );
              continue;
            }

            this.logger.log(
              `Reconciled missed webhook for tx ${tx.id} (${tx.merchantTxRef}) → PAID`,
              'ReconciliationScheduler',
            );

            // Write WebhookEvent audit record
            await this.prisma.webhookEvent.create({
              data: {
                source: 'NOMBA',
                payload: result.raw ?? {},
                idempotencyKey: `reconcile-paid-${tx.id}`,
                transactionId: tx.id,
                merchantId: tx.merchantId,
              },
            });

            // Notify merchant via WhatsApp
            if (tx.merchant) {
              const merchantWhatsappNumber = tx.merchant.whatsappNumber;

              try {
                await this.twilio.sendWhatsAppMessage(
                  merchantWhatsappNumber,
                  `🎉 Payment Confirmed!\n\n📦 Item: ${tx.quantity}x ${tx.itemDescription}\n💰 Amount: ₦${Number(tx.totalAmount).toLocaleString()}\nRef: ${tx.merchantTxRef}`,
                );
              } catch (notifyErr: any) {
                this.logger.error(
                  `Failed to notify merchant ${tx.merchantId} for tx ${tx.id}: ${notifyErr.message}`,
                  notifyErr.stack,
                  'ReconciliationScheduler',
                );
              }
            }
          } else if (result.isFailed) {
            await this.prisma.transaction.updateMany({
              where: { id: tx.id, status: 'AWAITING_PAYMENT' },
              data: { status: 'FAILED' },
            });

            // Audit record
            await this.prisma.webhookEvent.create({
              data: {
                source: 'NOMBA',
                payload: result.raw ?? {},
                idempotencyKey: `reconcile-failed-${tx.id}`,
                transactionId: tx.id,
                merchantId: tx.merchantId,
              },
            });

            this.logger.log(
              `Reconciled expired/failed tx ${tx.id} (${tx.merchantTxRef}) → FAILED`,
              'ReconciliationScheduler',
            );
          }
        } catch (err: any) {
          this.logger.error(
            `Error verifying tx ${tx.id}: ${err.message}`,
            err.stack,
            'ReconciliationScheduler',
          );
        }
      }
    } catch (err: any) {
      this.logger.error(
        `Reconciliation job failure: ${err.message}`,
        err.stack,
        'ReconciliationScheduler',
      );
    }
  }
}
