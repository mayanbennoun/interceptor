import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RateLimitInterceptor } from './rate-limit/rate-limit.interceptor';
import { RateLimitService } from './rate-limit/rate-limit.service';
import createMockRedis from 'ioredis-mock';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, RateLimitService, 
    RateLimitInterceptor,
    {
      provide: 'RedisClient',
      useFactory: () => new createMockRedis(),
    },
  ],
})
export class AppModule {}
