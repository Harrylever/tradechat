import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

class RequestOtpDto {
  whatsappNumber: string;
}

class VerifyOtpDto {
  whatsappNumber: string;
  otp: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @ApiOperation({ summary: 'Request a one-time password via WhatsApp' })
  requestOtp(@Body() body: RequestOtpDto) {
    return this.authService.requestOtp(body.whatsappNumber);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP and receive a JWT access token' })
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body.whatsappNumber, body.otp);
  }
}
