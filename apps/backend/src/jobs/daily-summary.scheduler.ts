import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../twilio/twilio.service';

@Injectable()
export class DailySummaryScheduler {
  private readonly logger = new Logger(DailySummaryScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly twilio: TwilioService,
  ) {}

  @Cron('0 8 * * *', {
    name: 'daily-whatsapp-summary',
    timeZone: 'Africa/Lagos',
  })
  async sendDailySummaries() {
    this.logger.log(
      'Starting daily 8:00 AM WhatsApp summary broadcast...',
      'DailySummaryScheduler',
    );

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const merchants = await this.prisma.merchant.findMany({
        where: { onboardingComplete: true },
      });

      for (const merchant of merchants) {
        const stats = await this.prisma.transaction.aggregate({
          where: {
            merchantId: merchant.id,
            status: 'PAID',
            paidAt: { gte: yesterday, lt: today },
          },
          _count: { id: true },
          _sum: { totalAmount: true },
        });

        const count = stats._count.id || 0;
        if (count > 0) {
          const totalNaira = Number(stats._sum.totalAmount || 0);
          const msg = `Good morning ${merchant.businessName}! 🌞\n\nHere is your sales summary for yesterday:\n✅ Total Paid Orders: ${count}\n💰 Total Revenue: ₦${totalNaira.toLocaleString()}\n\nHave a blessed trading day ahead!`;
          await this.twilio.sendWhatsAppMessage(merchant.whatsappNumber, msg);
        }
      }
    } catch (err: any) {
      this.logger.error(
        `Daily summary broadcast error: ${err.message}`,
        err.stack,
        'DailySummaryScheduler',
      );
    }
  }
}
