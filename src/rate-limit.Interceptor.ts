import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, throwError, from } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(private readonly redisClient:any) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const userId = request.user?.id;

    if (!userId) {
      return throwError(() => new HttpException('User ID is required', HttpStatus.BAD_REQUEST));
    }

    const currentHour = Math.floor(Date.now() / 3600000);
    // const key = `rate-limit:${userId}:${currentHour}`;
    const key= this.generateRateLimitKey(userId, currentHour);
    const maxRequests = 100;

    return from(this.checkAndIncrementRateLimit(key, maxRequests)).pipe(
      mergeMap(({ requestsLeft, isLimited }) => {
        if (isLimited) {
          const retryAfterSeconds = 3600 - (Date.now() / 1000 % 3600);
          response.header('Retry-After', Math.ceil(retryAfterSeconds));
          throw new HttpException({
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests, please try again later.',
            retryAfter: Math.ceil(retryAfterSeconds),
          }, HttpStatus.TOO_MANY_REQUESTS);
        }

        response.header('X-Count', requestsLeft.toString());
        return next.handle();
      }),
      catchError((err) => throwError(() => err))
    );
  }

  private async checkAndIncrementRateLimit(key: string, maxRequests: number): Promise<{ requestsLeft: number; isLimited: boolean }> {
    try {
      const multi = this.redisClient.multi();
      multi.incr(key);
      multi.expire(key, 3600);
      const results = await multi.exec();
  
      const currentCount = results[0][1] as number;
      const requestsLeft = maxRequests - currentCount;
      const isLimited = requestsLeft < 0;
  
      return { requestsLeft: Math.max(0, requestsLeft), isLimited };
    } catch (error) {
      console.error('Redis operation failed:', error);
      throw new HttpException('Rate limiting unavailable', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

 private generateRateLimitKey(userId: string, hour: number): string {
    return `rate-limit:${userId}:${hour}`;
  }
}