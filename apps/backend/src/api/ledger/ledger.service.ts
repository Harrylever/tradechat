import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async creditForPaidTransaction(
    transactionId: string,
    merchantId: string,
    amountNaira: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.update({
        where: { id: merchantId },
        data: { balanceNaira: { increment: amountNaira } },
      });

      const balanceAfterNaira = merchant.balanceNaira;
      const balanceBeforeNaira = balanceAfterNaira.minus(amountNaira);

      await tx.ledgerEntry.create({
        data: {
          merchantId,
          type: 'CREDIT',
          amountNaira,
          balanceBeforeNaira,
          balanceAfterNaira: merchant.balanceNaira,
          transactionId,
        },
      });

      return merchant;
    });
  }

  async debitForWithdrawal(
    merchantId: string,
    amountNaira: number,
    note?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.merchant.updateMany({
        where: { id: merchantId, balanceNaira: { gte: amountNaira } },
        data: { balanceNaira: { decrement: amountNaira } },
      });

      if (result.count === 0) {
        // Either the merchant doesn't exist, or balance was insufficient
        // at the moment this ran — including if a concurrent withdrawal
        // just consumed it. Either way, reject cleanly rather than
        // proceeding.
        throw new BadRequestException('Insufficient balance');
      }

      const merchant = await tx.merchant.findUniqueOrThrow({
        where: { id: merchantId },
      });

      const withdrawal = await tx.withdrawal.create({
        data: {
          merchantId,
          amountNaira,
          note,
          status: 'PENDING',
        },
      });

      const balanceAfterNaira = merchant.balanceNaira;
      const balanceBeforeNaira = balanceAfterNaira.plus(amountNaira);

      await tx.ledgerEntry.create({
        data: {
          merchantId,
          type: 'DEBIT',
          amountNaira,
          balanceBeforeNaira,
          balanceAfterNaira,
          withdrawalId: withdrawal.id,
        },
      });

      return withdrawal;
    });
  }
}
