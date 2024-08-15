import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RateLimitService } from './rate-limit.service';
import { Request, Response } from 'express';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(private readonly rateLimitService: RateLimitService) {}

  /**
   * Intercepts incoming HTTP requests to enforce rate limiting.
   * 
   * This method checks whether the request exceeds the rate limit based on the user ID provided .
   * If the user has exceeded their rate limit, it throws an HttpException with a TOO_MANY_REQUESTS status and includes
   * a 'Retry-Time' header in the response indicating when the user can make another request. If the limit is not exceeded,
   * it sets an 'X-Count' header in the response showing the remaining number of requests available.
   * 
   * @param context The execution context that contains details about the current request.
   * @param next The next handler in the request processing pipeline.
   * @returns An Observable that handles the request processing, or throws an error if the rate limit is exceeded.
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const httpContext = context.switchToHttp();
    const request: Request = httpContext.getRequest<Request>();
    const response: Response = httpContext.getResponse<Response>();
    const userId = request.query.userId as string;

    if (!userId) {
      throw new HttpException(
        'User ID is required to complete request',
        HttpStatus.BAD_REQUEST,
      );
    }

    const limitStatus = await this.rateLimitService.enforceRequestLimit(userId);
    if (limitStatus.isLimited) {
      response.setHeader('Retry-Time', limitStatus.retryTime);
      throw new HttpException(
        `Too many requests. Please retry again later on ${limitStatus.retryTime}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    response.setHeader('X-Count', limitStatus.remainingRequests);

    return next.handle().pipe(catchError((err) => throwError(() => err)));
  }
}
