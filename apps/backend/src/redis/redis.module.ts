import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * @Global() means this module only needs to be imported once in AppModule.
 * RedisService is then available for injection everywhere without each
 * feature module having to re-import RedisModule.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
