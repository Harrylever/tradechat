import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateMerchantDto {
  @ApiPropertyOptional({
    example: 'Alhaji & Sons Trading',
    description: 'Business name of the merchant',
  })
  @IsOptional()
  @IsString()
  businessName?: string;
}
