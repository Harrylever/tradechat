import { Module } from '@nestjs/common';
import { ReconciliationScheduler } from './reconciliation.scheduler';
import { DailySummaryScheduler } from './daily-summary.scheduler';
import { NombaModule } from '../api/nomba/nomba.module';
import { TwilioModule } from '../twilio/twilio.module';

@Module({
  imports: [NombaModule, TwilioModule],
  providers: [ReconciliationScheduler, DailySummaryScheduler],
})
export class JobsModule {}
