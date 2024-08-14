import { Injectable,Inject  } from '@nestjs/common';
import { Utils } from './utils';
@Injectable()
export class RateLimitService {
  private readonly TTL = 60 * 60; // 1 hour
  private readonly ALLOWED_REQUEST_COUNT = 3;

  constructor(@Inject('RedisClient') private readonly redisClient) {}

  async isExceededRequestsLimit(userId: string): Promise<{ isLimited: boolean; remainingRequests: number; retryTime?: string }> {
    const key = `rate-limit:${userId}`;
    const exists = await this.redisClient.exists(key);

    let currentValue = this.ALLOWED_REQUEST_COUNT;
    let ttl = this.TTL;

    if (exists) {
        currentValue = await this.redisClient.get(key);
        ttl = await this.redisClient.ttl(key);

        if (currentValue > 0) {
            await this.redisClient.decr(key);
        }
    } else {
        await this.redisClient.set(key, this.ALLOWED_REQUEST_COUNT - 1, 'EX', this.TTL);
    }

    let retryTime = Utils.formatTimestampWithTTL(ttl);
    const isLimited = currentValue <= 0;
    
    // calculate remaining requests based on the current value, as it's already decremented.
    const remainingRequests = currentValue > 0 ? currentValue - 1 : 0;

    return { isLimited, remainingRequests, retryTime };
  }
}