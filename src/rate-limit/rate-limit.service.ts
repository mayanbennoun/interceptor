import { Injectable,Inject  } from '@nestjs/common';
@Injectable()
export class RateLimitService {
  private readonly WINDOW_SIZE_IN_HOURS = 1;
  private readonly MAX_WINDOW_REQUEST_COUNT = 3;

  constructor(@Inject('RedisClient') private readonly redisClient) {}

  async isRateLimited(userId: string): Promise<{ isLimited: boolean; remainingRequests: number; retryTime?: string }> {
    const key = this.getRateLimitKey(userId);
    const currentCount = await this.redisClient.incr(key);
    if (currentCount === 1) {
      // Set expiration for the key when the first request is made
      await this.redisClient.expire(key, this.WINDOW_SIZE_IN_HOURS * 3600);
    }

    const remainingRequests = this.MAX_WINDOW_REQUEST_COUNT - currentCount;
    
    if (remainingRequests < 0) {
      const ttl = await this.redisClient.ttl(key);
      const retryTime = ttl > 0 ? this.formatRetryTime(ttl) : 'immediately'; // Format retry time or use 'immediately'
      return { isLimited: true, remainingRequests: 0, retryTime: retryTime };
    }

    return { isLimited: false, remainingRequests };
  }

  private getRateLimitKey(userId: string): string {
    return `rate-limit:${userId}`;
  }
  private formatRetryTime(ttl: number): string {
    const now = new Date();
    const retryTime = new Date(now.getTime() + ttl * 1000); // Convert seconds to milliseconds
    const hours = retryTime.getHours().toString().padStart(2, '0');
    const minutes = retryTime.getMinutes().toString().padStart(2, '0');
    return `retry at ${hours}:${minutes}`;
  }
}