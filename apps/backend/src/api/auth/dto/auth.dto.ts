import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({
    example: '+2348012345678',
    description: 'WhatsApp phone number',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+234[789]\d{9}$/, {
    message: 'Please provide a valid Nigerian WhatsApp number.',
  })
  whatsappNumber: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    example: '+2348012345678',
    description: 'WhatsApp phone number',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+234[789]\d{9}$/, {
    message: 'Please provide a valid Nigerian WhatsApp number.',
  })
  whatsappNumber: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}
