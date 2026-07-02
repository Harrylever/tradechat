import { Module } from '@nestjs/common';
import { NombaService } from './nomba.service';
import { NombaWebhookController } from './nomba-webhook.controller';
import { NombaSignatureGuard } from './nomba-signature.guard';

@Module({
  controllers: [NombaWebhookController],
  providers: [NombaService, NombaSignatureGuard],
  exports: [NombaService],
})
export class NombaModule {}
