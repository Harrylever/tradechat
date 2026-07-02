import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @ApiOperation({
    summary: 'List transactions filtered by merchantId or status',
  })
  async list(
    @Query('merchantId') merchantId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    return this.transactionService.listTransactions({
      merchantId,
      status,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get single transaction details along with associated webhook events',
  })
  async getDetails(@Param('id') id: string) {
    return this.transactionService.getTransaction(id);
  }
}
