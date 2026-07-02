import { Injectable, Logger } from '@nestjs/common';

import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NombaService } from '../api/nomba/nomba.service';

@Injectable()
export class ReconciliationScheduler {
  private readonly logger = new Logger(ReconciliationScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nombaService: NombaService,
  ) {}

  @Cron('0 2 * * *', {
    name: 'nightly-reconciliation',
    timeZone: 'Africa/Lagos',
  })
  async runNightlyReconciliation() {
    this.logger.log(
      'Starting nightly Nomba reconciliation job...',
      'ReconciliationScheduler',
    );

    try {
      // Find transactions pending for more than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const pendingTx = await this.prisma.transaction.findMany({
        where: {
          status: 'PENDING_CONFIRMATION',
          merchantTxRef: { not: null },
          createdAt: { lte: oneHourAgo },
        },
        take: 50,
      });

      this.logger.log(
        `Found ${pendingTx.length} pending transactions to verify against Nomba API`,
        'ReconciliationScheduler',
      );

      for (const tx of pendingTx) {
        if (!tx.merchantTxRef) continue;

        try {
          const result = await this.nombaService.verifyTransaction(
            tx.merchantTxRef,
          );
          if (
            result &&
            (result.status === 'SUCCESS' || result.responseCode === '00')
          ) {
            await this.prisma.transaction.update({
              where: { id: tx.id },
              data: { status: 'PAID', paidAt: new Date() },
            });
            this.logger.log(
              `Reconciled missed webhook for tx ${tx.id} (${tx.merchantTxRef}) -> PAID`,
              'ReconciliationScheduler',
            );
          } else if (
            result &&
            (result.status === 'EXPIRED' || result.status === 'FAILED')
          ) {
            await this.prisma.transaction.update({
              where: { id: tx.id },
              data: { status: 'FAILED' },
            });
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
        `Nightly reconciliation failure: ${err.message}`,
        err.stack,
        'ReconciliationScheduler',
      );
    }
  }
}
