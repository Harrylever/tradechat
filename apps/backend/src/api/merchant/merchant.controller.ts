import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MerchantService } from './merchant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  JwtUser,
} from 'src/common/decorators/current-user.decorator';
import { UpdateMerchantDto } from './dto/merchant.dto';

@ApiTags('Merchants')
@UseGuards(JwtAuthGuard)
@Controller('merchants')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get merchant profile by ID' })
  async getProfile(@CurrentUser() user: JwtUser) {
    return await this.merchantService.getMerchantProfile(user.sub);
  }

  @Get('me/stats')
  @ApiOperation({
    summary: 'Get merchant sales statistics and transaction volume',
  })
  async getStats(@CurrentUser() user: JwtUser) {
    return await this.merchantService.getMerchantStats(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update merchant profile details' })
  async updateProfile(
    @CurrentUser() user: JwtUser,
    @Body() body: UpdateMerchantDto,
  ) {
    return await this.merchantService.updateMerchant(user.sub, body);
  }
}
