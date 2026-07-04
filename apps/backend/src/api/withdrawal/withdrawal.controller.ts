import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WithdrawalService } from './withdrawal.service';

class RequestWithdrawalDto {
  amountNaira: number;
}

class SaveBankAccountDto {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

@ApiTags('Withdrawals')
@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get available withdrawal balance' })
  getBalance(@Req() req: any) {
    return this.withdrawalService.getBalance(req.user.merchantId);
  }

  @Post()
  @ApiOperation({ summary: 'Submit a withdrawal request' })
  requestWithdrawal(@Req() req: any, @Body() body: RequestWithdrawalDto) {
    return this.withdrawalService.requestWithdrawal(
      req.user.merchantId,
      body.amountNaira,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List withdrawal history' })
  listWithdrawals(@Req() req: any) {
    return this.withdrawalService.listWithdrawals(req.user.merchantId);
  }

  @Get('bank-account')
  @ApiOperation({ summary: 'Get saved bank account' })
  getBankAccount(@Req() req: any) {
    return this.withdrawalService.getBankAccount(req.user.merchantId);
  }

  @Put('bank-account')
  @ApiOperation({ summary: 'Save or update bank account details' })
  saveBankAccount(@Req() req: any, @Body() body: SaveBankAccountDto) {
    return this.withdrawalService.saveBankAccount(req.user.merchantId, body);
  }
}
