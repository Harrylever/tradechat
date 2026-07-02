import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MerchantService } from './merchant.service';

@ApiTags('Merchants')
@Controller('merchants')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get merchant profile by ID' })
  async getProfile(@Param('id') id: string) {
    return this.merchantService.getMerchantProfile(id);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get merchant sales statistics and transaction volume',
  })
  async getStats(@Param('id') id: string) {
    return this.merchantService.getMerchantStats(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update merchant profile details' })
  async updateProfile(
    @Param('id') id: string,
    @Body() body: { businessName?: string; nombaMerchantId?: string },
  ) {
    return this.merchantService.updateMerchant(id, body);
  }
}
