import { Injectable,Inject  } from '@nestjs/common';
import Redis from 'ioredis-mock';

@Injectable()
export class RateLimitService {
  private readonly WINDOW_SIZE_IN_HOURS = 1;
  private readonly MAX_WINDOW_REQUEST_COUNT = 100;

  constructor(@Inject('RedisClient') private readonly redisClient) {}

  async isRateLimited(userId: string): Promise<{ isLimited: boolean; remainingRequests: number; retryAfter?: number }> {
    const key = this.getRateLimitKey(userId);
    const currentCount = await this.redisClient.incr(key);
    if (currentCount === 1) {
      // Set expiration for the key when the first request is made
      await this.redisClient.expire(key, this.WINDOW_SIZE_IN_HOURS * 3600);
    }

    const remainingRequests = this.MAX_WINDOW_REQUEST_COUNT - currentCount;
    
    if (remainingRequests < 0) {
      const ttl = await this.redisClient.ttl(key);
      return { isLimited: true, remainingRequests: 0, retryAfter: ttl };
    }

    return { isLimited: false, remainingRequests };
  }

  private getRateLimitKey(userId: string): string {
    return `rate-limit:${userId}`;
  }
}

