import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReconciliationScheduler } from './reconciliation.scheduler';
import { DailySummaryScheduler } from './daily-summary.scheduler';
import { ReconciliationProcessor } from './reconciliation.processor';
import { NombaModule } from '../api/nomba/nomba.module';
import { TwilioModule } from '../twilio/twilio.module';

@Module({
  imports: [
    NombaModule,
    TwilioModule,
    BullModule.registerQueue({
      name: 'reconciliation',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    }),
  ],
  providers: [
    ReconciliationScheduler,
    DailySummaryScheduler,
    ReconciliationProcessor,
  ],
})
export class JobsModule {}
