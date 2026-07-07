import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async listTransactions(
    merchantId: string,
    query: {
      status?: any;
      limit?: number;
    },
  ) {
    const where: Prisma.TransactionWhereInput = {};
    where.merchantId = merchantId;
    if (query.status) where.status = query.status;

    return await this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit ? Number(query.limit) : 50,
    });
  }

  async getTransaction(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { webhookEvents: true, merchant: true },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }
}
