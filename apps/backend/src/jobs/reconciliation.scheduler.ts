import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReconciliationScheduler {
  private readonly logger = new Logger(ReconciliationScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('reconciliation') private readonly reconciliationQueue: Queue,
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
        `Found ${pendingTx.length} AWAITING_PAYMENT transaction(s) to dispatch to reconciliation queue`,
        'ReconciliationScheduler',
      );

      for (const tx of pendingTx) {
        if (!tx.merchantTxRef) continue;

        await this.reconciliationQueue.add(
          'verify-tx',
          { txId: tx.id, ref: tx.merchantTxRef },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: 100,
          },
        );
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
