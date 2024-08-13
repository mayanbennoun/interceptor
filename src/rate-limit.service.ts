import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RateLimitService {
  private readonly WINDOW_SIZE_IN_HOURS = 1;
  private readonly MAX_WINDOW_REQUEST_COUNT = 100;

  constructor(private readonly redisClient: Redis) {}

  async isRateLimited(userId: string): Promise<{ isLimited: boolean; remainingRequests: number; retryAfter?: number }> {
    const record = await this.getRateLimitRecord(userId);
    const currentRequestTime = Date.now();
    const windowStartTimestamp = currentRequestTime - this.WINDOW_SIZE_IN_HOURS * 60 * 60 * 1000;

    const requestsWithinWindow = record.filter((entry) => entry > windowStartTimestamp);
    const totalWindowRequestsCount = requestsWithinWindow.length;

    if (totalWindowRequestsCount >= this.MAX_WINDOW_REQUEST_COUNT) {
      const oldestRequestTime = requestsWithinWindow[0];
      const retryAfter = Math.ceil((oldestRequestTime - windowStartTimestamp) / 1000);
      return { isLimited: true, remainingRequests: 0, retryAfter };
    } else {
      record.push(currentRequestTime);
      await this.saveRateLimitRecord(userId, record);
      const remainingRequests = this.MAX_WINDOW_REQUEST_COUNT - (totalWindowRequestsCount + 1);
      return { isLimited: false, remainingRequests };
    }
  }

  private async getRateLimitRecord(clientId: string): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.redisClient.get(`rateLimit:${clientId}`, (err, record) => {
        if (err) reject(err);
        resolve(record ? JSON.parse(record) : []);
      });
    });
  }

  private async saveRateLimitRecord(clientId: string, record: number[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.redisClient.set(`rateLimit:${clientId}`, JSON.stringify(record), (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}