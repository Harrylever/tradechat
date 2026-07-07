import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as Sentry from '@sentry/nestjs';
import { getRedisConnectionParams } from './redis.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly url: string | undefined;

  constructor(private readonly config: ConfigService) {
    // this.url = this.config.get<string>('REDIS_URL');
    const options = getRedisConnectionParams(config);
    this.url = options?.url;
  }

  async onModuleInit() {
    if (!this.url) {
      this.logger.warn(
        'REDIS_URL not set — RedisService will operate in no-op mode.',
      );
      return;
    }

    try {
      this.client = new Redis(this.url, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      this.client.on('error', (err) => {
        this.logger.error(`Redis connection error: ${err.message}`, err.stack);
        Sentry.captureException(err, { tags: { service: 'RedisService' } });
      });

      await this.client.connect();
      this.logger.log('Redis connected successfully.');
    } catch (err: any) {
      this.logger.error(
        `Failed to connect to Redis: ${err.message}. Falling back to no-op.`,
        err.stack,
      );
      Sentry.captureException(err, { tags: { service: 'RedisService' } });
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
      this.client = null;
    }
  }

  /** Whether Redis is connected and available */
  get isAvailable(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }

  /**
   * Expose the raw ioredis client for consumers that need it
   * (e.g. ThrottlerStorageRedisService).
   * Returns null when Redis is unavailable.
   */
  get rawClient(): Redis | null {
    return this.client;
  }

  /** Get a string value. Returns null on miss or error. */
  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch (err: any) {
      this.logger.error(`GET ${key} failed: ${err.message}`);
      Sentry.captureException(err, { tags: { operation: 'redis_get', key } });
      return null;
    }
  }

  /** Set a string value with an optional TTL (seconds). */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (err: any) {
      this.logger.error(`SET ${key} failed: ${err.message}`);
      Sentry.captureException(err, { tags: { operation: 'redis_set', key } });
    }
  }

  /** Delete one or more keys. */
  async del(...keys: string[]): Promise<void> {
    if (!this.client || keys.length === 0) return;
    try {
      await this.client.del(...keys);
    } catch (err: any) {
      this.logger.error(`DEL [${keys.join(', ')}] failed: ${err.message}`);
      Sentry.captureException(err, {
        tags: { operation: 'redis_del' },
        extra: { keys },
      });
    }
  }

  /** Get and parse a JSON value. Returns null on miss, error, or parse failure. */
  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /** Stringify and set a JSON value with an optional TTL. */
  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  /** Check if a key exists. */
  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      return (await this.client.exists(key)) === 1;
    } catch {
      return false;
    }
  }

  /** Get remaining TTL for a key in seconds. Returns -1 if no TTL, -2 if key doesn't exist. */
  async ttl(key: string): Promise<number> {
    if (!this.client) return -2;
    try {
      return await this.client.ttl(key);
    } catch {
      return -2;
    }
  }
}
