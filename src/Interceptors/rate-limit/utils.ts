import { Injectable  } from '@nestjs/common';
@Injectable()
export class Utils {
    static formatRetryTime(ttl: number): string {
        const now = new Date();
        const retryTime = new Date(now.getTime() + ttl * 1000); // Convert seconds to milliseconds
        const hours = retryTime.getHours().toString().padStart(2, '0');
        const minutes = retryTime.getMinutes().toString().padStart(2, '0');
        return `retry at ${hours}:${minutes}`;
      }
}