import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TwilioService } from '../../twilio/twilio.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { MerchantService } from '../merchant/merchant.service';
import { normalizePhoneNumber } from 'src/common/utils/phone';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly otpStore = new Map<
    string,
    { otp: string; expiresAt: number }
  >();

  constructor(
    private readonly jwtService: JwtService,
    private readonly twilioService: TwilioService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
    private readonly merchantService: MerchantService,
  ) {}

  private keyGenerator = (whatsappNumber: string) => {
    return `auth:otp:${whatsappNumber}`;
  };

  async requestOtp(rawNumber: string): Promise<{ message: string }> {
    const whatsappNumber = normalizePhoneNumber(rawNumber);

    const merchant = await this.merchantService.findByPhone(whatsappNumber);

    if (!merchant) {
      throw new BadRequestException(
        'No merchant account found for this WhatsApp number.',
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    const ttlSeconds = 300; // 5 minutes

    const key = this.keyGenerator(whatsappNumber);
    await this.redisService.setJson(key, { otp, expiresAt }, ttlSeconds);
    this.otpStore.set(whatsappNumber, { otp, expiresAt });

    const message = `Your Tradechat sign-in code is: *${otp}*\n\nThis code expires in 5 minutes. Do not share it with anyone.`;
    await this.twilioService.sendWhatsAppMessage(whatsappNumber, message);

    this.logger.log(`OTP sent to ${whatsappNumber}`);

    return { message: 'OTP sent to your WhatsApp number.' };
  }

  async verifyOtp(
    rawNumber: string,
    otp: string,
  ): Promise<{ accessToken: string; merchant: any }> {
    const whatsappNumber = normalizePhoneNumber(rawNumber);
    const key = this.keyGenerator(whatsappNumber);

    const storedRedis = await this.redisService.getJson<{
      otp: string;
      expiresAt: number;
    }>(key);
    const storedMem = this.otpStore.get(whatsappNumber);
    const stored = storedRedis || storedMem;

    if (!stored) {
      throw new UnauthorizedException('No OTP requested for this number.');
    }

    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(whatsappNumber);
      await this.redisService.del(key);
      throw new UnauthorizedException(
        'OTP has expired. Please request a new one.',
      );
    }

    if (stored.otp !== otp.trim()) {
      throw new UnauthorizedException('Invalid OTP.');
    }

    // OTP valid — delete it (single-use)
    this.otpStore.delete(whatsappNumber);
    await this.redisService.del(key);

    const merchant =
      await this.merchantService.findOrCreateByPhone(whatsappNumber);

    if (!merchant) {
      throw new BadRequestException('Merchant not found');
    }

    const m = merchant;
    const payload = { sub: m.id, whatsappNumber };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Merchant ${m.id} authenticated via OTP`);

    return {
      accessToken,
      merchant: {
        id: m.id,
        businessName: m.businessName,
        whatsappNumber: m.whatsappNumber,
        tier: m.tier,
        onboardingComplete: m.onboardingComplete,
      },
    };
  }
}
