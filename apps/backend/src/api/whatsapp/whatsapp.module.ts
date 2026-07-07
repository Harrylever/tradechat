import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppProcessor } from './whatsapp.processor';
import { GeminiModule } from '../../gemini/gemini.module';
import { NombaModule } from '../nomba/nomba.module';
import { TwilioModule } from '../../twilio/twilio.module';
import { MerchantModule } from '../merchant/merchant.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    GeminiModule,
    NombaModule,
    TwilioModule,
    AuthModule,
    BullModule.registerQueue({
      name: 'whatsapp-messages',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    }),
    MerchantModule,
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsAppProcessor],
  exports: [WhatsAppService, WhatsAppProcessor, BullModule],
})
export class WhatsAppModule {}
