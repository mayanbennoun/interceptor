import { Injectable  } from '@nestjs/common';
@Injectable()
export class Utils {
  /**
     * Formats a timestamp based on the provided TTL.
     * 
     * This method calculates when a Redis key will expire and returns the expiration time as an ISO string.
     * 
     * @param ttl The time-to-live (TTL) of the Redis key in seconds.
     * @param currentTime The current time in milliseconds (default: current system time).
     * @returns A string representing the expiration time in ISO format (without milliseconds).
     */
    static formatTimestampWithTTL(ttl: number, currentTime: number = Date.now()): string {
      const date = new Date(currentTime + (ttl * 1000));
      return date.toISOString().split('.')[0];
    }
}