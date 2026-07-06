import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { QueueOptions } from 'bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './api/health/health.module';
import { NombaModule } from './api/nomba/nomba.module';
import { TwilioModule } from './twilio/twilio.module';
import { GeminiModule } from './gemini/gemini.module';
import { WhatsAppModule } from './api/whatsapp/whatsapp.module';
import { MerchantModule } from './api/merchant/merchant.module';
import { TransactionModule } from './api/transaction/transaction.module';
import { JobsModule } from './jobs/jobs.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { AuthModule } from './api/auth/auth.module';
import { WithdrawalModule } from './api/withdrawal/withdrawal.module';
import { LedgerModule } from './api/ledger/ledger.module';
import { RedisModule } from './redis/redis.module';
import { APP_GUARD } from '@nestjs/core';
import { getRedisConnectionParams } from './redis/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    SentryModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): QueueOptions => {
        const options = getRedisConnectionParams(config);
        if (!options) {
          throw new Error('REDIS_URL is required for BullMQ');
        }

        return {
          connection: {
            host: options.host,
            port: options.port,
            ...(options.username && { username: options.username }),
            ...(options.password && { password: options.password }),
            ...(options.tls && { tls: options.tls }),
          },
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const options = getRedisConnectionParams(config);
        if (!options) {
          throw new Error('REDIS_URL is required for ThrottlerModule');
        }

        return {
          storage: new ThrottlerStorageRedisService(new Redis(options.url)),
          throttlers: [
            {
              name: 'default',
              ttl: 60000,
              limit: 10,
            },
          ],
        };
      },
    }),
    PrismaModule,
    HealthModule,
    NombaModule,
    TwilioModule,
    GeminiModule,
    WhatsAppModule,
    MerchantModule,
    TransactionModule,
    AuthModule,
    WithdrawalModule,
    LedgerModule,
    RedisModule,
    JobsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
