import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import Redis from 'ioredis';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
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

type RedisConnectionParams = {
  url: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  maxRetriesPerRequest: number | null | undefined;
  tls?: { rejectUnauthorized: boolean };
};

const getConnectionParams = (
  config?: ConfigService,
): RedisConnectionParams | null => {
  const getEnv = (key: string) =>
    config ? config.get<string>(key) : process.env[key];

  const redisUrl = getEnv('REDIS_URL');
  if (!redisUrl) return null; // ← early return instead of unassigned result

  try {
    const parsed = new URL(redisUrl);
    const options: RedisConnectionParams = {
      url: redisUrl,
      host: parsed.hostname || 'localhost',
      port: Number(parsed.port) || 6379,
      maxRetriesPerRequest: null,
    };

    if (parsed.username) options.username = decodeURIComponent(parsed.username);
    if (parsed.password) options.password = decodeURIComponent(parsed.password);
    if (parsed.protocol === 'rediss:') {
      options.tls = { rejectUnauthorized: false };
    }

    return options;
  } catch (error) {
    console.error(
      'Failed to parse REDIS_URL, falling back to individual env variables:',
      error,
    );
    throw error;
  }
};

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    SentryModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): QueueOptions => {
        // ← explicit return type
        const options = getConnectionParams(config);
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
        const connectionObject = getConnectionParams(config);
        if (!connectionObject) {
          throw new Error('REDIS_URL is required for BullMQ');
        }

        return {
          storage: new ThrottlerStorageRedisService(
            new Redis(connectionObject.url),
          ),
          throttlers: [
            {
              ttl: 60000,
              limit: 20,
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
    JobsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
