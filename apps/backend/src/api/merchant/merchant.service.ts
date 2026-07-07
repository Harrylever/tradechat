import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizePhoneNumber } from 'src/common/utils/phone';

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  async getMerchantProfile(id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
    });
    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }
    return merchant;
  }

  async getMerchantStats(id: string) {
    await this.getMerchantProfile(id); // ensure exists

    const [totalTransactions, paidTransactions, aggregateVolume] =
      await Promise.all([
        this.prisma.transaction.count({ where: { merchantId: id } }),
        this.prisma.transaction.count({
          where: { merchantId: id, status: 'PAID' },
        }),
        this.prisma.transaction.aggregate({
          where: { merchantId: id, status: 'PAID' },
          _sum: { totalAmount: true },
        }),
      ]);

    const totalVolumeNaira = Number(aggregateVolume._sum.totalAmount || 0);

    return {
      merchantId: id,
      totalTransactions,
      paidTransactions,
      successRate:
        totalTransactions > 0
          ? ((paidTransactions / totalTransactions) * 100).toFixed(1) + '%'
          : '0%',
      totalVolumeNaira,
    };
  }

  async updateMerchant(
    id: string,
    data: {
      businessName?: string;
      ownerName?: string;
      productCategory?: string;
      nombaMerchantId?: string;
      onboardingComplete?: boolean;
    },
  ) {
    return await this.prisma.merchant.update({
      where: { id },
      data,
    });
  }

  async findByPhone(phone: string) {
    const clean = normalizePhoneNumber(phone);
    return await this.prisma.merchant.findUnique({
      where: { whatsappNumber: clean },
    });
  }

  async findOrCreateByPhone(rawPhone: string) {
    const whatsappNumber = normalizePhoneNumber(rawPhone);

    const existing = await this.prisma.merchant.findUnique({
      where: { whatsappNumber },
    });
    if (existing) return existing;

    return this.prisma.merchant.create({
      data: {
        businessName: `Trader ${whatsappNumber.slice(-5)}`,
        whatsappNumber,
        tier: 'FREE',
        // onboardingComplete defaults to false — this is what gates
        // whether the merchant sees a setup step before the real
        // dashboard, regardless of which surface created the account.
      },
    });
  }
}
