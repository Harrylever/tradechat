import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListTransactionsDto } from './dto/transaction.dto';
import {
  CurrentUser,
  JwtUser,
} from 'src/common/decorators/current-user.decorator';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'List transactions filtered by merchantId or status',
  })
  async list(
    @CurrentUser() user: JwtUser,
    @Query() query: ListTransactionsDto,
  ) {
    return this.transactionService.listTransactions(user.sub, {
      status: query.status,
      limit: query.limit,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get single transaction details along with associated webhook events',
  })
  async getDetails(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.transactionService.getTransaction(id, user.sub);
  }
}
