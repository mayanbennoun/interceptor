import { Injectable  } from '@nestjs/common';
@Injectable()
export class Utils {
    static formatTimestampWithTTL(ttl: number, currentTime: number = Date.now()): string {
      // Return the timestamp when the key will expire
      const date = new Date(currentTime + (ttl * 1000));
      return date.toISOString().split('.')[0];
    }
}