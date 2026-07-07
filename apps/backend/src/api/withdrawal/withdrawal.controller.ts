import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WithdrawalService } from './withdrawal.service';
import {
  CurrentUser,
  JwtUser,
} from 'src/common/decorators/current-user.decorator';
import { RequestWithdrawalDto, SaveBankAccountDto } from './dto/withdrawal.dto';

@ApiTags('Withdrawals')
@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Get('me/balance')
  @ApiOperation({ summary: 'Get available withdrawal balance' })
  getBalance(@CurrentUser() user: JwtUser) {
    return this.withdrawalService.getBalance(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Submit a withdrawal request' })
  requestWithdrawal(
    @CurrentUser() user: JwtUser,
    @Body() body: RequestWithdrawalDto,
  ) {
    return this.withdrawalService.requestWithdrawal(user.sub, body.amountNaira);
  }

  @Get('me')
  @ApiOperation({ summary: 'List withdrawal history' })
  listWithdrawals(@CurrentUser() user: JwtUser) {
    return this.withdrawalService.listWithdrawals(user.sub);
  }

  @Get('me/bank-account')
  @ApiOperation({ summary: 'Get saved bank account' })
  getBankAccount(@CurrentUser() user: JwtUser) {
    return this.withdrawalService.getBankAccount(user.sub);
  }

  @Put('me/bank-account')
  @ApiOperation({ summary: 'Save or update bank account details' })
  saveBankAccount(
    @CurrentUser() user: JwtUser,
    @Body() body: SaveBankAccountDto,
  ) {
    return this.withdrawalService.saveBankAccount(user.sub, body);
  }
}
