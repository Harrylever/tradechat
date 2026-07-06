import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService, ExtractedOrder } from '../../gemini/gemini.service';
import { NombaService } from '../nomba/nomba.service';
import { NotificationService } from '../../twilio/notification.service';
import { RedisService } from '../../redis/redis.service';
import { MerchantService } from '../merchant/merchant.service';
import { MagicLinkService } from '../auth/magic-link.service';
import { normalizePhoneNumber } from 'src/common/utils/phone';
import { Merchant } from 'src/generated/prisma/client';

interface OnboardingState {
  ownerName: string;
  businessName: string;
  productCategory: string;
}

interface ConversationState {
  step:
    | 'IDLE'
    | 'ONBOARD_GATHER'
    | 'CONFIRMING_ORDER'
    | 'ONBOARDING_CONFIRM'
    | '';
  pendingOrder?: ExtractedOrder;
  pendingOnboarding?: Partial<OnboardingState>;
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
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
    private readonly merchantService: MerchantService,
    private readonly magicLinkService: MagicLinkService,
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

  private readonly placeholderPhrases = [
    'your name',
    'business name',
    'what you sell',
  ];

  private resolveField(value?: string): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (trimmed.length === 0) return undefined;

    const bracketMatch = /^\[(.*)\]$/.exec(trimmed);
    const inner = bracketMatch ? bracketMatch[1].trim() : trimmed;

    if (inner.length === 0) return undefined;
    if (this.placeholderPhrases.includes(inner.toLowerCase())) {
      return undefined;
    }

    return inner; // brackets always stripped, whether or not they were present
  }

  async handleIncomingMessage(
    fromPhone: string,
    messageBody: string,
  ): Promise<void> {
    const cleanPhone = normalizePhoneNumber(fromPhone);
    const text = messageBody.trim();
    this.logger.log(
      `Handling message from ${cleanPhone}: "${text}"`,
      'WhatsAppService',
    );

    // Find or create merchant by phone number
    const merchant = await this.merchantService.findOrCreateByPhone(fromPhone);

    const state = await this.getState(cleanPhone);

    if (!merchant.onboardingComplete && state.step !== 'CONFIRMING_ORDER') {
      return this.handleOnboardingFlow(merchant, cleanPhone, text, state);
    }

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
          this.configService.get<string>('WEB_APP_URL') ||
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

  private async handleOnboardingFlow(
    merchant: Merchant,
    cleanPhone: string,
    text: string,
    state: ConversationState,
  ): Promise<void> {
    const step = state.step;
    const pending = state.pendingOnboarding || {};

    if (step === 'ONBOARDING_CONFIRM') {
      const lower = text.toLowerCase();
      if (lower === '1' || lower === 'yes' || lower === 'y') {
        await this.merchantService.updateMerchant(merchant.id, {
          ownerName: pending.ownerName,
          businessName: pending.businessName,
          productCategory: pending.productCategory,
          onboardingComplete: true,
        });
        const magicLink = await this.magicLinkService.issueMagicLink(
          merchant.id,
        );
        const completionMsg = `You're all set, ${pending.ownerName}! 🎉 ${pending.businessName} is ready to roll on Tradechat.\n\nTap here to see your dashboard:\n${magicLink}\n\nWhenever you make a sale, just tell me here like: "Sold 2 bags rice to Ade, 15000" and I'll handle the rest.`;
        await this.notificationService.sendWhatsApp(cleanPhone, completionMsg);
        await this.clearState(cleanPhone);
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
          "No wahala! Send your details again whenever you're ready.",
        );
        return;
      } else {
        const confirmMsg = `Make we confirm 👇\n\n👤 Name: ${pending.ownerName}\n🏪 Business: ${pending.businessName}\n📦 Category: ${this.formatCategoryDisplay(pending.productCategory)}\n\nReply 1 to confirm, or 2 to start over.`;
        await this.notificationService.sendWhatsApp(cleanPhone, confirmMsg);
        return;
      }
    }

    if (step === 'ONBOARD_GATHER') {
      const extracted = await this.gemini.parseOnboardingMessage(text);

      const merged: Partial<OnboardingState> = {
        ownerName: this.resolveField(extracted.ownerName) ?? pending.ownerName,
        businessName:
          this.resolveField(extracted.businessName) ?? pending.businessName,
        productCategory:
          this.resolveField(extracted.productCategory) ??
          pending.productCategory,
      };

      if (
        !merged.ownerName ||
        !merged.businessName ||
        !merged.productCategory
      ) {
        await this.setState(cleanPhone, {
          step: 'ONBOARD_GATHER',
          pendingOnboarding: merged,
        });

        const question =
          `${extracted.clarifyingQuestion}\n\nLet's setup your store\nMy name is [Your Name]\nMy business is [Business Name]\nI sell [What You Sell]`.trim();
        await this.notificationService.sendWhatsApp(cleanPhone, question);
        return;
      }

      await this.setState(cleanPhone, {
        step: 'ONBOARDING_CONFIRM',
        pendingOnboarding: merged,
      });
      const confirmMsg = `Make we confirm 👇\n\n👤 Name: ${extracted.ownerName}\n🏪 Business: ${extracted.businessName}\n📦 Category: ${this.formatCategoryDisplay(extracted.productCategory)}\n\nReply 1 to confirm, or 2 to start over.`;
      await this.notificationService.sendWhatsApp(cleanPhone, confirmMsg);
      return;
    }

    const extracted = await this.gemini.parseOnboardingMessage(text);

    const merged: Partial<OnboardingState> = {
      ownerName: this.resolveField(extracted.ownerName) ?? pending.ownerName,
      businessName:
        this.resolveField(extracted.businessName) ?? pending.businessName,
      productCategory:
        this.resolveField(extracted.productCategory) ?? pending.productCategory,
    };

    if (merged.ownerName && merged.businessName && merged.productCategory) {
      await this.setState(cleanPhone, {
        step: 'ONBOARDING_CONFIRM',
        pendingOnboarding: merged,
      });
      const confirmMsg = `Make we confirm 👇\n\n👤 Name: ${extracted.ownerName}\n🏪 Business: ${extracted.businessName}\n📦 Category: ${this.formatCategoryDisplay(extracted.productCategory)}\n\nReply 1 to confirm, or 2 to start over.`;
      await this.notificationService.sendWhatsApp(cleanPhone, confirmMsg);
      return;
    }

    const question = `Welcome to Tradechat 🎉. Let's setup your store\n\nMy name is [Your Name]\nMy business is [Business Name]\nI sell [What You Sell]`;
    await this.setState(cleanPhone, { step: 'ONBOARD_GATHER' });
    await this.notificationService.sendWhatsApp(cleanPhone, question);
    return;
  }

  private formatCategoryDisplay(category?: string): string {
    switch (category) {
      case 'FOOD_AND_GROCERIES':
        return 'Food & Groceries';
      case 'FASHION_AND_APPAREL':
        return 'Fashion & Apparel';
      case 'ELECTRONICS_AND_GADGETS':
        return 'Electronics & Gadgets';
      case 'BEAUTY_AND_PERSONAL_CARE':
        return 'Beauty & Personal Care';
      case 'HOME_AND_LIVING':
        return 'Home & Living';
      case 'SERVICES':
        return 'Services';
      default:
        return 'Other';
    }
  }
}
