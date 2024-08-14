import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
import { Observable ,throwError} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RateLimitService } from './rate-limit.service';


@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
    constructor( private readonly rateLimitService: RateLimitService){} 

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> { 
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const userId = request.query.userId;
        if (!userId) {
            return throwError(() => new HttpException('User ID is required to complete request', HttpStatus.BAD_REQUEST));
          }

        const limitStatus = await this.rateLimitService.isRateLimited(userId);
         if (limitStatus.isLimited) {
          response.setHeader('Retry-Time', limitStatus.retryTime);
          throw new HttpException(`Too many requests. Please ${limitStatus.retryTime}.`, HttpStatus.TOO_MANY_REQUESTS);
        }
        response.setHeader('X-Count', limitStatus.remainingRequests);

        return next.handle().pipe(
          catchError((err) => throwError(() => err)),
        );
    }
}