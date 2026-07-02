import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { GeminiModule } from '../../gemini/gemini.module';
import { NombaModule } from '../nomba/nomba.module';
import { TwilioModule } from '../../twilio/twilio.module';

@Module({
  imports: [GeminiModule, NombaModule, TwilioModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
