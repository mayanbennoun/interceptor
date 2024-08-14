import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RateLimitInterceptor } from './Interceptors/rate-limit/rate-limit.interceptor';
import { RateLimitService } from './Interceptors/rate-limit/rate-limit.service';
import Redis from 'ioredis';


@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, RateLimitService, 
    RateLimitInterceptor,
    {
      provide: 'RedisClient',
      useFactory: () => new Redis(), // Default Redis client
    },
  ],
})
export class AppModule {}
