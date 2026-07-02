import {
  Controller,
  Post,
  Body,
  Headers,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { NombaSignatureGuard } from './nomba-signature.guard';

@ApiTags('Webhooks - Nomba')
@Controller('webhook/nomba')
export class NombaWebhookController {
  private readonly logger = new Logger(NombaWebhookController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(NombaSignatureGuard)
  @ApiOperation({ summary: 'Nomba payment event webhook receiver' })
  async handleWebhook(
    @Body() payload: any,
    // @Headers() headers: any
  ) {
    const eventType =
      payload?.event_type || payload?.eventType || payload?.event;
    const data = payload?.data || payload;
    const ref =
      data?.orderReference ||
      data?.merchantTxRef ||
      data?.transactionReference ||
      'N/A';

    this.logger.log(
      `Received Nomba webhook event [${eventType}] ref:${ref}`,
      'NombaWebhookController',
    );

    // Handle payment success events
    if (
      eventType === 'payment_success' ||
      eventType === 'transaction.success' ||
      eventType === 'checkout.completed' ||
      data?.status === 'SUCCESS' ||
      data?.responseCode === '00'
    ) {
      if (ref && ref !== 'N/A') {
        const transaction = await this.prisma.transaction.findFirst({
          where: {
            OR: [{ merchantTxRef: ref }, { id: ref }],
          },
        });

        if (transaction) {
          if (transaction.status === 'PAID') {
            this.logger.log(
              `Transaction ${ref} is already marked as PAID (idempotent ignore)`,
              'NombaWebhookController',
            );
            return { received: true, status: 'already_paid' };
          }

          await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'PAID',
              paidAt: new Date(),
            },
          });

          this.logger.log(
            `Successfully updated transaction ${transaction.id} (${ref}) status to PAID`,
            'NombaWebhookController',
          );
        } else {
          this.logger.warn(
            `No matching transaction found for webhook ref:${ref}`,
            'NombaWebhookController',
          );
        }
      }
    }

    return { received: true };
  }
}
