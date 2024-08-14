import { Injectable,Inject  } from '@nestjs/common';
import { Utils } from './utils';
@Injectable()
export class RateLimitService {
  private readonly HOURS = 1;
  private readonly Allowed_REQUEST_COUNT = 3;

  constructor(@Inject('RedisClient') private readonly redisClient) {}

  async isExceededRequestsLimit(userId: string): Promise<{ isLimited: boolean; remainingRequests: number; retryTime?: string }> {
    const key = `rate-limit:${userId}`;
    //const currentCount = await this.redisClient.incr(key);
    const currentCount = await this.redisClient.eval(
      `
      local currentCount = redis.call("INCR", KEYS[1])
      if currentCount == 1 then
        redis.call("EXPIRE", KEYS[1], ARGV[1])
      end
      return currentCount
      `,
      1,
      key,
      this.HOURS * 3600
    );
    console.log( `count ${currentCount}, userid ${userId} `)
    if (currentCount === 1) {
      // Set expiration for the key when the first request is made
      await this.redisClient.expire(key, this.HOURS * 3600);
    }

    const remainingRequests = this.Allowed_REQUEST_COUNT - currentCount;
    
    if (remainingRequests < 0) {
      const ttl = await this.redisClient.ttl(key);
      const retryTime = ttl > 0 ? Utils.formatRetryTime(ttl) : null; // Format retry time or set to null
      return { isLimited: true, remainingRequests: 0, retryTime: retryTime };
    }

    return { isLimited: false, remainingRequests };
  }
}