import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MerchantService } from './merchant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Merchants')
@Controller('merchants')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Get()
  @ApiOperation({ summary: 'Find merchant by WhatsApp phone number' })
  async findByPhone(@Query('phone') phone: string) {
    if (!phone) throw new NotFoundException('phone query param is required');
    const merchant = await this.merchantService.findByPhone(phone);
    if (!merchant) throw new NotFoundException('Merchant not found');
    return merchant;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get merchant profile by ID' })
  async getProfile(@Param('id') id: string) {
    return this.merchantService.getMerchantProfile(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get merchant sales statistics and transaction volume',
  })
  async getStats(@Param('id') id: string) {
    return this.merchantService.getMerchantStats(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update merchant profile details' })
  async updateProfile(
    @Param('id') id: string,
    @Body() body: { businessName?: string; nombaMerchantId?: string },
  ) {
    return this.merchantService.updateMerchant(id, body);
  }
}
