import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
import { Observable,from ,throwError ,scheduled,asyncScheduler} from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
    constructor( private readonly redisClient:any){} //redis client will be injected 

    //fix return just  <Observable<any>
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> { 
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const userId = request.user?.id;
        if (!userId) {
            return throwError(() => new HttpException('User ID is required to complete request', HttpStatus.BAD_REQUEST));
          }
        const currentHour = new Date().getHours();
        const key = `rate-limit:${userId}:${currentHour}`;
        const maxRequests = 100;
    
        let currentCount = await this.redisClient.get(key);
        currentCount = currentCount ? parseInt(currentCount, 10) : 0;
    
        const requestsLeft = maxRequests - currentCount;
    
        if (requestsLeft <= 0) {
          const retryAfterSeconds = 3600 - (new Date().getMinutes() * 60 + new Date().getSeconds());
          response.setHeader('Retry-After', retryAfterSeconds);
          response.status(429);
    
          return scheduled(
            Promise.resolve(
              response.json({
                statusCode: 429,
                message: 'Too many requests, please try again later.',
                retryAfter: retryAfterSeconds,
              })
            ),
            asyncScheduler
          );
        }
    
        await this.redisClient.multi().incr(key).expire(key, 3600).exec();
        response.setHeader('X-Count', requestsLeft - 1);
    
        return scheduled(next.handle(), asyncScheduler).pipe(
          tap(() => {}),
          catchError((err) => throwError(() => err)),
        );
    }
}
