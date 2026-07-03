import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
    data: { businessName?: string; nombaMerchantId?: string },
  ) {
    return await this.prisma.merchant.update({
      where: { id },
      data,
    });
  }

  async findByPhone(phone: string) {
    const clean = phone.startsWith('+') ? phone : `+${phone}`;
    return await this.prisma.merchant.findUnique({
      where: { whatsappNumber: clean },
    });
  }
}
