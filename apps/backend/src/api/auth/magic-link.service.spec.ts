import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { MagicLinkService } from './magic-link.service';
import { RedisService } from '../../redis/redis.service';
import { MerchantService } from '../merchant/merchant.service';

describe('MagicLinkService', () => {
  let service: MagicLinkService;
  let redisService: RedisService;
  let merchantService: MerchantService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MagicLinkService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock.jwt.token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'WEB_APP_URL') return 'https://tradechat.app';
              return null;
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            setJson: jest.fn().mockResolvedValue(undefined),
            getJson: jest.fn(),
            del: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: MerchantService,
          useValue: {
            getMerchantProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MagicLinkService>(MagicLinkService);
    redisService = module.get<RedisService>(RedisService);
    merchantService = module.get<MerchantService>(MerchantService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('issueMagicLink', () => {
    it('should generate a token, save to redis with 10 min TTL, and return URL', async () => {
      const url = await service.issueMagicLink('merchant-123');

      expect(url).toContain('https://tradechat.app/auth/magic?token=');
      expect(redisService.setJson).toHaveBeenCalledWith(
        expect.stringMatching(/^magiclink:/),
        { merchantId: 'merchant-123' },
        600,
      );
    });
  });

  describe('consumeMagicLink', () => {
    it('should throw UnauthorizedException if token is empty', async () => {
      await expect(service.consumeMagicLink('')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token expired or already used', async () => {
      (redisService.getJson as jest.Mock).mockResolvedValue(null);

      await expect(service.consumeMagicLink('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should delete key, verify merchant, and return JWT on valid token', async () => {
      (redisService.getJson as jest.Mock).mockResolvedValue({
        merchantId: 'merchant-123',
      });
      const mockMerchant = {
        id: 'merchant-123',
        businessName: 'Test Biz',
        whatsappNumber: '2348012345678',
        tier: 'FREE',
        onboardingComplete: true,
      };
      (merchantService.getMerchantProfile as jest.Mock).mockResolvedValue(
        mockMerchant,
      );

      const result = await service.consumeMagicLink('valid-token');

      expect(redisService.del).toHaveBeenCalledWith('magiclink:valid-token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'merchant-123',
        whatsappNumber: '2348012345678',
      });
      expect(result).toEqual({
        accessToken: 'mock.jwt.token',
        merchant: mockMerchant,
      });
    });
  });
});
