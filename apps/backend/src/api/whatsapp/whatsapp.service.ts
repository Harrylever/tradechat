import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService, ExtractedOrder } from '../../gemini/gemini.service';
import { NombaService } from '../nomba/nomba.service';
import { TwilioService } from '../../twilio/twilio.service';
import { NotificationService } from '../../twilio/notification.service';
import { RedisService } from '../../redis/redis.service';

interface ConversationState {
  step: 'IDLE' | 'CONFIRMING_ORDER';
  pendingOrder?: ExtractedOrder;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private memoryCache = new Map<
    string,
    { state: ConversationState; expiresAt: number }
  >();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly nomba: NombaService,
    private readonly twilio: TwilioService,
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
  ) {}

  private async getState(phone: string): Promise<ConversationState> {
    const key = `wa:state:${phone}`;
    const data = await this.redisService.getJson<ConversationState>(key);
    if (data) return data;

    const cached = this.memoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.state;
    }
    return { step: 'IDLE' };
  }

  private async setState(
    phone: string,
    state: ConversationState,
  ): Promise<void> {
    const key = `wa:state:${phone}`;
    const ttlSeconds = 1800; // 30 mins
    await this.redisService.setJson(key, state, ttlSeconds);
    this.memoryCache.set(key, {
      state,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private async clearState(phone: string): Promise<void> {
    const key = `wa:state:${phone}`;
    await this.redisService.del(key);
    this.memoryCache.delete(key);
  }

  async handleIncomingMessage(
    fromPhone: string,
    messageBody: string,
  ): Promise<void> {
    const cleanPhone = fromPhone.replace('whatsapp:', '').trim();
    const text = messageBody.trim();
    this.logger.log(
      `Handling message from ${cleanPhone}: "${text}"`,
      'WhatsAppService',
    );

    // Find or create merchant by phone number
    let merchant = await this.prisma.merchant.findUnique({
      where: { whatsappNumber: cleanPhone },
    });

    if (!merchant) {
      // Auto-register merchant if first contact
      merchant = await this.prisma.merchant.create({
        data: {
          businessName: `Trader ${cleanPhone.slice(-4)}`,
          whatsappNumber: cleanPhone,
          tier: 'FREE',
        },
      });
      this.logger.log(
        `Auto-registered new merchant ${merchant.id} for phone ${cleanPhone}`,
        'WhatsAppService',
      );
    }

    const state = await this.getState(cleanPhone);

    if (state.step === 'CONFIRMING_ORDER') {
      const lower = text.toLowerCase();
      if (lower === '1' || lower === 'yes' || lower === 'y') {
        const order = state.pendingOrder!;
        await this.clearState(cleanPhone);

        // Create transaction in DB first to get UUID for orderReference
        const transaction = await this.prisma.transaction.create({
          data: {
            merchantId: merchant.id,
            customerIdentifier: order.customerName || 'Customer',
            itemDescription: order.itemDescription || 'Market Item',
            quantity: order.quantity || 1,
            unitPrice: order.amountNaira || 0,
            totalAmount: order.amountNaira || 0,
            status: 'PENDING_CONFIRMATION',
          },
        });

        const baseUrl =
          this.configService.get<string>('PAYMENT_RETURN_URL') ||
          'http://localhost:3000';
        const callbackUrl = `${baseUrl}/payment/verify?trxref=${transaction.id}`;

        try {
          const checkout = await this.nomba.createCheckoutOrder({
            amountNaira: order.amountNaira || 0,
            orderReference: transaction.id,
            callbackUrl,
            customerId: merchant.id,
          });

          await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              merchantTxRef: checkout.orderReference,
              checkoutLink: checkout.checkoutLink,
              status: 'AWAITING_PAYMENT',
            },
          });

          const reply = `✅ Payment Link Ready!\n\nCustomer: ${order.customerName || 'Customer'}\nItem: ${order.quantity || 1}x ${order.itemDescription}\nAmount: ₦${(order.amountNaira || 0).toLocaleString()}\n\nSend this link to collect payment:\n👉 ${checkout.checkoutLink}`;

          await this.notificationService.sendWhatsApp(cleanPhone, reply);
        } catch (err: any) {
          this.logger.error(
            `Failed to generate Nomba link: ${err.message}`,
            err.stack,
            'WhatsAppService',
          );
          await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'FAILED' },
          });
          await this.notificationService.sendWhatsApp(
            cleanPhone,
            '❌ Ah, small network issue creating the payment link right now. Abeg try send the order again in a minute.',
          );
        }
        return;
      } else if (
        lower === '2' ||
        lower === 'no' ||
        lower === 'n' ||
        lower === 'cancel'
      ) {
        await this.clearState(cleanPhone);
        await this.notificationService.sendWhatsApp(
          cleanPhone,
          'No wahala! Order cancelled. Whenever you ready for another order, just type am.',
        );
        return;
      }
    }

    // Default or IDLE state: parse natural language with Gemini
    const extracted = await this.gemini.parseMessage(text);
    if (extracted.confidence === 'LOW') {
      const question =
        extracted.clarifyingQuestion ||
        'Abeg how much be the total amount for the order?';
      await this.notificationService.sendWhatsApp(cleanPhone, question);
      return;
    }

    // Store state and ask for confirmation
    await this.setState(cleanPhone, {
      step: 'CONFIRMING_ORDER',
      pendingOrder: extracted,
    });

    const confirmMsg = `Confirm payment link details:\n\n👤 Customer: ${extracted.customerName || 'Customer'}\n📦 Item: ${extracted.quantity || 1}x ${extracted.itemDescription}\n💰 Total Amount: ₦${(extracted.amountNaira || 0).toLocaleString()}\n\nReply:\n1️⃣ for YES (Create Link)\n2️⃣ for NO (Cancel)`;
    await this.notificationService.sendWhatsApp(cleanPhone, confirmMsg);
  }
}
