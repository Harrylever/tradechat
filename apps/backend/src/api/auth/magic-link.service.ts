import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { MerchantService } from '../merchant/merchant.service';
import * as crypto from 'crypto';

@Injectable()
export class MagicLinkService {
  private readonly logger = new Logger(MagicLinkService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
    private readonly merchantService: MerchantService,
  ) {}

  async issueMagicLink(merchantId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const key = `magiclink:${token}`;
    const ttlSeconds = 600; // 10 minutes

    await this.redisService.setJson(key, { merchantId }, ttlSeconds);

    const webAppUrl =
      this.config.get<string>('WEB_APP_URL') || 'http://localhost:3000';
    return `${webAppUrl}/auth/magic?token=${token}`;
  }

  async consumeMagicLink(
    token: string,
  ): Promise<{ accessToken: string; merchant: any }> {
    if (!token) {
      throw new UnauthorizedException('Token is required.');
    }

    const key = `magiclink:${token}`;
    const data = await this.redisService.getJson<{ merchantId: string }>(key);

    if (!data || !data.merchantId) {
      throw new UnauthorizedException(
        'Magic link has expired or already been used.',
      );
    }

    // Single-use enforcement: immediately delete token
    await this.redisService.del(key);

    const merchant = await this.merchantService.getMerchantProfile(
      data.merchantId,
    );

    const payload = {
      sub: merchant.id,
      whatsappNumber: merchant.whatsappNumber,
    };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Merchant ${merchant.id} authenticated via magic link`);

    return {
      accessToken,
      merchant: {
        id: merchant.id,
        businessName: merchant.businessName,
        whatsappNumber: merchant.whatsappNumber,
        tier: merchant.tier,
        onboardingComplete: merchant.onboardingComplete,
      },
    };
  }
}
