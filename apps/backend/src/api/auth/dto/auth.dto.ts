import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({
    example: '+2348012345678',
    description: 'WhatsApp phone number',
  })
  @IsString()
  @IsNotEmpty()
  whatsappNumber: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    example: '+2348012345678',
    description: 'WhatsApp phone number',
  })
  @IsString()
  @IsNotEmpty()
  whatsappNumber: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}
