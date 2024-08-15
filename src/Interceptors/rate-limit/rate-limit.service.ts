import { Injectable, Inject } from '@nestjs/common';
import { Utils } from './utils';
@Injectable()
export class RateLimitService {
  private readonly ttl: number;
  private readonly allowedRequestCount: number;

  /**
   * Constructs the RateLimitService with a Redis client, TTL, and allowed request count.
   * 
   * @param redisClient The Redis client used for storing and retrieving rate limit data.
   * @param ttl The time-to-live (TTL) for the rate limit key in Redis (default: 1 hour).
   * @param allowedRequestCount The number of requests allowed within the TTL period (default: 100).
   */
  constructor(
    @Inject('RedisClient') private readonly redisClient,
    ttl: number = 60 * 60, // Default TTL is 1 hour
    allowedRequestCount: number = 100, // Default allowed requests count is 100
  ) {
    this.ttl = ttl;
    this.allowedRequestCount = allowedRequestCount;
  }

  /**
   * Enforces the rate limit for a given user ID.
   * 
   * This method checks whether the user has exceeded their allowed request limit within the TTL period.
   * It uses Redis to track the number of requests and sets an expiration time for the rate limit key.
   * 
   * @param userId The ID of the user making the request.
   * @returns A promise that resolves to an object containing the rate limit status, remaining requests, and retry time.
   */
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
    /**
    * Enforces the rate limit for a given user ID.
    * checks if a rate limit key exists in Redis. If it does, it decrements the request count and updates the TTL; 
    * if not, it creates the key with an initial request count and sets the TTL.
    */
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
