import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiService } from '../../gemini/gemini.service';
import { NombaService } from '../nomba/nomba.service';
import { TwilioService } from '../../twilio/twilio.service';
import { NotificationService } from '../../twilio/notification.service';
import { RedisService } from '../../redis/redis.service';
import { MerchantService } from '../merchant/merchant.service';
import { MagicLinkService } from '../auth/magic-link.service';

describe('WhatsAppService - Onboarding Flow', () => {
  let service: WhatsAppService;
  let merchantService: MerchantService;
  let geminiService: GeminiService;
  let notificationService: NotificationService;
  let magicLinkService: MagicLinkService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:3000') },
        },
        {
          provide: PrismaService,
          useValue: {
            merchant: { create: jest.fn(), update: jest.fn() },
            transaction: { create: jest.fn(), update: jest.fn() },
          },
        },
        {
          provide: GeminiService,
          useValue: {
            parseOnboardingMessage: jest.fn(),
            classifyProductCategory: jest.fn(),
            parseMessage: jest.fn(),
          },
        },
        {
          provide: NombaService,
          useValue: { createCheckoutOrder: jest.fn() },
        },
        {
          provide: TwilioService,
          useValue: { sendWhatsAppMessage: jest.fn() },
        },
        {
          provide: NotificationService,
          useValue: { sendWhatsApp: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: RedisService,
          useValue: {
            getJson: jest.fn().mockResolvedValue(null),
            setJson: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: MerchantService,
          useValue: {
            findOrCreateByPhone: jest.fn(),
            updateMerchant: jest.fn(),
          },
        },
        {
          provide: MagicLinkService,
          useValue: {
            issueMagicLink: jest
              .fn()
              .mockResolvedValue('https://tradechat.app/auth/magic?token=xyz'),
          },
        },
      ],
    }).compile();

    service = module.get<WhatsAppService>(WhatsAppService);
    merchantService = module.get<MerchantService>(MerchantService);
    geminiService = module.get<GeminiService>(GeminiService);
    notificationService = module.get<NotificationService>(NotificationService);
    magicLinkService = module.get<MagicLinkService>(MagicLinkService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleIncomingMessage - Onboarding Branching', () => {
    const mockPhone = 'whatsapp:2348012345678';
    const cleanPhone = '2348012345678';

    it('should branch to onboarding if merchant.onboardingComplete is false', async () => {
      (merchantService.findOrCreateByPhone as jest.Mock).mockResolvedValue({
        id: 'merchant-1',
        onboardingComplete: false,
      });
      (geminiService.parseOnboardingMessage as jest.Mock).mockResolvedValue({
        confidence: 'HIGH',
        ownerName: 'Chinedu',
        businessName: 'Chinedu Ventures',
        productCategory: 'ELECTRONICS_AND_GADGETS',
      });

      await service.handleIncomingMessage(
        mockPhone,
        'Chinedu, Chinedu Ventures, electronics',
      );

      expect(geminiService.parseOnboardingMessage).toHaveBeenCalled();
      expect(notificationService.sendWhatsApp).toHaveBeenCalledWith(
        cleanPhone,
        expect.stringContaining('Make we confirm 👇'),
      );
    });

    it('should ask for name if onboarding message has LOW confidence (e.g. unedited template)', async () => {
      (merchantService.findOrCreateByPhone as jest.Mock).mockResolvedValue({
        id: 'merchant-1',
        onboardingComplete: false,
      });
      (geminiService.parseOnboardingMessage as jest.Mock).mockResolvedValue({
        confidence: 'LOW',
        clarifyingQuestion: "Oya let's set you up! First — wetin be your name?",
        missingFields: ['ownerName', 'businessName', 'productCategory'],
      });

      await service.handleIncomingMessage(mockPhone, 'My name is [Your Name]');

      expect(notificationService.sendWhatsApp).toHaveBeenCalledWith(
        cleanPhone,
        "Oya let's set you up! First — wetin be your name?",
      );
      expect(redisService.setJson).toHaveBeenCalledWith(
        `wa:state:${cleanPhone}`,
        expect.objectContaining({ step: 'ONBOARDING_ASK_NAME' }),
        expect.any(Number),
      );
    });

    it('should advance from ONBOARDING_ASK_NAME to ONBOARDING_ASK_BUSINESS', async () => {
      (merchantService.findOrCreateByPhone as jest.Mock).mockResolvedValue({
        id: 'merchant-1',
        onboardingComplete: false,
      });
      (redisService.getJson as jest.Mock).mockResolvedValue({
        step: 'ONBOARDING_ASK_NAME',
        pendingOnboarding: {},
      });

      await service.handleIncomingMessage(mockPhone, 'Chinedu');

      expect(redisService.setJson).toHaveBeenCalledWith(
        `wa:state:${cleanPhone}`,
        expect.objectContaining({
          step: 'ONBOARDING_ASK_BUSINESS',
          pendingOnboarding: { ownerName: 'Chinedu' },
        }),
        expect.any(Number),
      );
      expect(notificationService.sendWhatsApp).toHaveBeenCalledWith(
        cleanPhone,
        'Nice one, Chinedu! Wetin your business dey called?',
      );
    });

    it('should complete onboarding when merchant confirms with 1 in ONBOARDING_CONFIRM', async () => {
      (merchantService.findOrCreateByPhone as jest.Mock).mockResolvedValue({
        id: 'merchant-1',
        onboardingComplete: false,
      });
      (redisService.getJson as jest.Mock).mockResolvedValue({
        step: 'ONBOARDING_CONFIRM',
        pendingOnboarding: {
          ownerName: 'Chinedu',
          businessName: 'Chinedu Ventures',
          productCategory: 'ELECTRONICS_AND_GADGETS',
        },
      });

      await service.handleIncomingMessage(mockPhone, '1');

      expect(merchantService.updateMerchant).toHaveBeenCalledWith(
        'merchant-1',
        {
          ownerName: 'Chinedu',
          businessName: 'Chinedu Ventures',
          productCategory: 'ELECTRONICS_AND_GADGETS',
          onboardingComplete: true,
        },
      );
      expect(magicLinkService.issueMagicLink).toHaveBeenCalledWith(
        'merchant-1',
      );
      expect(notificationService.sendWhatsApp).toHaveBeenCalledWith(
        cleanPhone,
        expect.stringContaining("You're all set, Chinedu! 🎉"),
      );
      expect(redisService.del).toHaveBeenCalledWith(`wa:state:${cleanPhone}`);
    });
  });
});
