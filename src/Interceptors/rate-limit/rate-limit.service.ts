import { Injectable, Inject } from '@nestjs/common';
import { Utils } from './utils';
@Injectable()
export class RateLimitService {
  private readonly ttl: number;
  private readonly allowedRequestCount: number;

  constructor(
    @Inject('RedisClient') private readonly redisClient,
    ttl: number = 60 * 60, // Default TTL is 1 hour
    allowedRequestCount: number = 100, // Default allowed requests count is 100
  ) {
    this.ttl = ttl;
    this.allowedRequestCount = allowedRequestCount;
  }

  async enforceRequestLimit(
    userId: string,
  ): Promise<{
    isLimited: boolean;
    remainingRequests: number;
    retryTime?: string;
  }> {
    const key = `rate-limit:${userId}`;
    const exists = await this.redisClient.exists(key);

    let currentValue = this.allowedRequestCount;
    let ttl = this.ttl;

    if (exists) {
      currentValue = await this.redisClient.get(key);
      ttl = await this.redisClient.ttl(key);

      if (currentValue > 0) {
        await this.redisClient.decr(key);
      }
    } else {
      await this.redisClient.set(
        key,
        this.allowedRequestCount - 1,
        'EX',
        this.ttl,
      );
    }

    let retryTime = Utils.formatTimestampWithTTL(ttl);
    const isLimited = currentValue <= 0;

    // calculate remaining requests based on the current value, as it's already decremented.
    const remainingRequests = currentValue > 0 ? currentValue - 1 : 0;

    return { isLimited, remainingRequests, retryTime };
  }
}
