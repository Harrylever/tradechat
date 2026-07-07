import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

@Injectable()
export class WithdrawalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  async getBalance(merchantId: string): Promise<{ availableNaira: number }> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { balanceNaira: true },
    });
    const availableNaira = Number(merchant?.balanceNaira || 0);
    return { availableNaira };
  }

  async requestWithdrawal(merchantId: string, amountNaira: number) {
    if (amountNaira <= 0) {
      throw new BadRequestException('Amount must be greater than zero.');
    }

    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { merchantId },
    });

    if (!bankAccount) {
      throw new BadRequestException(
        'Please save a bank account before requesting a withdrawal.',
      );
    }

    const withdrawal = await this.ledgerService.debitForWithdrawal(
      merchantId,
      amountNaira,
    );

    return {
      ...withdrawal,
      amountNaira: Number(withdrawal.amountNaira),
      message: 'Withdrawal request submitted — processing within 24 hours.',
    };
  }

  async listWithdrawals(merchantId: string) {
    const rows = await this.prisma.withdrawal.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((w) => ({ ...w, amountNaira: Number(w.amountNaira) }));
  }

  async getBankAccount(merchantId: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { merchantId },
    });
    if (!account) throw new NotFoundException('No bank account saved yet.');
    return account;
  }

  async saveBankAccount(
    merchantId: string,
    data: { bankCode: string; accountNumber: string; accountName: string },
  ) {
    return await this.prisma.bankAccount.upsert({
      where: { merchantId },
      create: { merchantId, ...data },
      update: { ...data },
    });
  }
}
