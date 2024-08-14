import Redis from 'ioredis-mock';
import { RateLimitService } from '../src/Interceptors/rate-limit/rate-limit.service';

export const redisMockProvider = {
  provide: 'RedisClient',
  useFactory: () => new Redis(),
};

export const rateLimitServiceProvider = {
    provide: RateLimitService,
    useFactory: (redisClient) => new RateLimitService(redisClient, 5, 3),
    inject: ['RedisClient'],
  };
  