import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from './gemini.service';

describe('GeminiService - Onboarding', () => {
  let service: GeminiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'NODE_ENV') return 'test';
              if (key === 'GEMINI_API_KEY') return 'mock-api-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GeminiService>(GeminiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseOnboardingMessage', () => {
    it('should return LOW confidence and skip API call when unedited placeholder is present', async () => {
      const generateContentSpy = jest.fn();
      if ((service as any).ai) {
        (service as any).ai.models = { generateContent: generateContentSpy };
      }

      const result = await service.parseOnboardingMessage(
        'Hi TradeChat! 👋\nMy name is [Your Name]\nMy business is [Business Name]\nI sell [What You Sell]',
      );

      expect(result.confidence).toBe('LOW');
      expect(result.missingFields).toEqual([
        'ownerName',
        'businessName',
        'productCategory',
      ]);
      expect(result.clarifyingQuestion).toContain('wetin be your name');
      expect(generateContentSpy).not.toHaveBeenCalled();
    });

    it('should return HIGH confidence for a well-formed onboarding message', async () => {
      const mockResponse = {
        confidence: 'HIGH',
        ownerName: 'Blessing',
        businessName: "Blessing's Perfumes",
        productCategory: 'BEAUTY_AND_PERSONAL_CARE',
      };

      if ((service as any).ai) {
        (service as any).ai.models = {
          generateContent: jest.fn().mockResolvedValue({
            text: JSON.stringify(mockResponse),
          }),
        };
      }

      const result = await service.parseOnboardingMessage(
        "Hi, I'm Blessing, I run Blessing's Perfumes, I sell perfumes and body spray",
      );

      expect(result.confidence).toBe('HIGH');
      expect(result.ownerName).toBe('Blessing');
      expect(result.businessName).toBe("Blessing's Perfumes");
      expect(result.productCategory).toBe('BEAUTY_AND_PERSONAL_CARE');
    });

    it('should force LOW confidence if Gemini returns HIGH but required field is missing', async () => {
      const mockResponse = {
        confidence: 'HIGH',
        ownerName: 'Blessing',
      };

      if ((service as any).ai) {
        (service as any).ai.models = {
          generateContent: jest.fn().mockResolvedValue({
            text: JSON.stringify(mockResponse),
          }),
        };
      }

      const result = await service.parseOnboardingMessage("Hi, I'm Blessing");

      expect(result.confidence).toBe('LOW');
      expect(result.missingFields).toContain('businessName');
      expect(result.missingFields).toContain('productCategory');
      expect(result.clarifyingQuestion).toContain(
        'Wetin your business dey called',
      );
    });
  });
});
