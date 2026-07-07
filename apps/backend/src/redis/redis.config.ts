import { ConfigService } from '@nestjs/config';

export type RedisConnectionParams = {
  url: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  maxRetriesPerRequest: number | null | undefined;
  tls?: { rejectUnauthorized: boolean };
};

/**
 * Single source of truth for parsing REDIS_URL into connection params.
 * BullMQ, ThrottlerModule, and RedisService should all call this instead
 * of each re-implementing their own URL parsing / TLS detection — that
 * duplication is what let the earlier `redis:` vs `rediss:` bug ship in
 * one place but not another.
 */
export const getRedisConnectionParams = (
  config?: ConfigService,
): RedisConnectionParams | null => {
  const getEnv = (key: string) =>
    config ? config.get<string>(key) : process.env[key];

  const redisUrl = getEnv('REDIS_URL');
  if (!redisUrl) return null;

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
      options.tls = { rejectUnauthorized: true };
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
