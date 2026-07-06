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
import { NotificationService } from '../../twilio/notification.service';
import { LedgerService } from '../ledger/ledger.service';
import { NombaSignatureGuard } from './nomba-signature.guard';

@ApiTags('Webhooks - Nomba')
@Controller('webhook/nomba')
export class NombaWebhookController {
  private readonly logger = new Logger(NombaWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly ledgerService: LedgerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(NombaSignatureGuard)
  @ApiOperation({ summary: 'Nomba payment event webhook receiver' })
  async handleWebhook(@Body() payload: any) {
    const eventType = payload?.event_type || payload?.eventType || 'UNKNOWN';
    const data = payload?.data || {};
    const orderData = data?.order || {};

    const ref = orderData?.orderReference || 'N/A';

    this.logger.log(
      `Received Nomba webhook event [${eventType}] ref:${ref}`,
      'NombaWebhookController',
    );

    // Record audit event
    const requestId =
      payload?.requestId ||
      `nomba-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    try {
      await this.prisma.webhookEvent.create({
        data: {
          source: 'NOMBA',
          idempotencyKey: requestId,
          payload: payload || {},
        },
      });
    } catch (auditErr: any) {
      this.logger.warn(
        `Failed to record WebhookEvent audit: ${auditErr?.message}`,
        'NombaWebhookController',
      );
    }

    if (ref === 'N/A') {
      return { received: true, status: 'no_reference_found' };
    }

    const transaction = await this.prisma.transaction.findFirst({
      where: {
        OR: [{ merchantTxRef: ref }, { id: ref }],
      },
      include: { merchant: true },
    });

    if (!transaction) {
      this.logger.warn(
        `No matching transaction found for webhook ref:${ref}`,
        'NombaWebhookController',
      );
      return { received: true, status: 'transaction_not_found' };
    }

    // Link transaction and merchant on audit record
    try {
      await this.prisma.webhookEvent.updateMany({
        where: { idempotencyKey: requestId },
        data: {
          transactionId: transaction.id,
          merchantId: transaction.merchantId,
        },
      });
    } catch (linkErr) {
      this.logger.error(linkErr);
    }

    // Handle payment success
    if (eventType === 'payment_success' || eventType === 'payout_success') {
      if (transaction.status === 'PAID') {
        this.logger.log(
          `Transaction ${transaction.id} (${ref}) is already marked as PAID (idempotent ignore)`,
          'NombaWebhookController',
        );
        return { received: true, status: 'already_paid' };
      }

      const { count } = await this.prisma.transaction.updateMany({
        where: { id: transaction.id, status: 'AWAITING_PAYMENT' },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      if (count > 0) {
        await this.ledgerService.creditForPaidTransaction(
          transaction.id,
          transaction.merchantId,
          Number(transaction.totalAmount),
        );
      }

      this.logger.log(
        `Successfully updated transaction ${transaction.id} (${ref}) status to PAID via [${eventType}]`,
        'NombaWebhookController',
      );

      // Notify merchant via WhatsApp
      if (transaction.merchant) {
        try {
          await this.notificationService.sendWhatsApp(
            transaction.merchant.whatsappNumber,
            `🎉 Payment Confirmed!\n\n📦 Item: ${transaction.quantity}x ${transaction.itemDescription}\n💰 Amount: ₦${Number(transaction.totalAmount).toLocaleString()}\nRef: ${transaction.merchantTxRef || ref}`,
          );
        } catch (notifyErr: any) {
          this.logger.error(
            `Failed to send WhatsApp confirmation for tx ${transaction.id}: ${notifyErr?.message}`,
          );
        }
      }
    }
    // Handle payment failure or payout refund
    else if (eventType === 'payment_failed' || eventType === 'payout_refund') {
      if (transaction.status === 'AWAITING_PAYMENT') {
        await this.prisma.transaction.updateMany({
          where: { id: transaction.id, status: 'AWAITING_PAYMENT' },
          data: { status: 'FAILED' },
        });
        this.logger.log(
          `Updated transaction ${transaction.id} (${ref}) status to FAILED via [${eventType}]`,
          'NombaWebhookController',
        );

        if (transaction.merchant) {
          try {
            await this.notificationService.sendWhatsApp(
              transaction.merchant.whatsappNumber,
              `❌ Payment Failed/Refunded\n\n📦 Item: ${transaction.quantity}x ${transaction.itemDescription}\n💰 Amount: ₦${Number(transaction.totalAmount).toLocaleString()}\nRef: ${transaction.merchantTxRef || ref}`,
            );
          } catch (notifyErr: any) {
            this.logger.error(
              `Failed to send WhatsApp failure notification for tx ${transaction.id}: ${notifyErr?.message}`,
            );
          }
        }
      }
    }

    return { received: true };
  }
}
