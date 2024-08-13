import { Module } from '@nestjs/common';
import { RateLimitInterceptor } from './rate-limit.interceptor';
import { RateLimitService } from './rate-limit.service';
import { RateLimitController } from './rate-limit.controller';
import Redis from 'ioredis';

@Module({
  controllers: [RateLimitController],
  providers: [
    RateLimitInterceptor,
    RateLimitService,
    {
      provide: 'RedisClient',
      useClass: Redis,
    },
  ],
  exports: [RateLimitInterceptor],
})
export class RateLimitModule {}