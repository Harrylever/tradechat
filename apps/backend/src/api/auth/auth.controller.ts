import { Body, Controller, Injectable, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { MagicLinkService } from './magic-link.service';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';

@Injectable()
class PhoneAwareThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const phone = req.body?.whatsappNumber ?? 'unknown';
    console.log(`${req.ip}:${phone}`);
    return `${req.ip}:${phone}`;
  }
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly magicLinkService: MagicLinkService,
  ) {}

  @Throttle({ default: { ttl: 600000, limit: 3 } })
  @UseGuards(PhoneAwareThrottlerGuard)
  @Post('otp/request')
  @ApiOperation({ summary: 'Request a one-time password via WhatsApp' })
  requestOtp(@Body() body: RequestOtpDto) {
    return this.authService.requestOtp(body.whatsappNumber);
  }

  @Throttle({ default: { ttl: 600000, limit: 5 } })
  @UseGuards(PhoneAwareThrottlerGuard)
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP and receive a JWT access token' })
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body.whatsappNumber, body.otp);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseGuards(ThrottlerGuard)
  @Post('magic/consume')
  @ApiOperation({ summary: 'Consume a single-use magic link token' })
  consumeMagicLink(@Body('token') token: string) {
    return this.magicLinkService.consumeMagicLink(token);
  }
}
