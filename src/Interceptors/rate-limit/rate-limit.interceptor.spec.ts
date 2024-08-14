import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitInterceptor } from './rate-limit.interceptor';
import { RateLimitService } from './rate-limit.service';
import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { of } from 'rxjs';
import Redis from 'ioredis-mock';
import {
  rateLimitServiceProvider,
  redisMockProvider,
} from '../../../test/mocks';

describe('RateLimitInterceptor', () => {
  let interceptor: RateLimitInterceptor;
  let rateLimitService: RateLimitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        redisMockProvider,
        rateLimitServiceProvider,
        RateLimitInterceptor,
      ],
    }).compile();

    rateLimitService = module.get(RateLimitService);
    interceptor = module.get(RateLimitInterceptor);
  });

  it('should throw error when userId is not provided', async () => {
    const context = createMockExecutionContext({});
    const next: CallHandler = { handle: () => of(true) };

    await expect(interceptor.intercept(context, next)).rejects.toThrow(
      new HttpException(
        'User ID is required to complete request',
        HttpStatus.BAD_REQUEST,
      ),
    );
  });

  it('should allow request when limit is not exceeded', async () => {
    jest
      .spyOn(rateLimitService, 'enforceRequestLimit')
      .mockResolvedValue({ isLimited: false, remainingRequests: 2 });

    const context = createMockExecutionContext({ userId: '1' });
    const next: CallHandler = { handle: () => of(true) };

    await expect(interceptor.intercept(context, next)).resolves.toBeDefined();
  });

  it('should deny request when limit is exceeded', async () => {
    jest.spyOn(rateLimitService, 'enforceRequestLimit').mockResolvedValue({
      isLimited: true,
      remainingRequests: 0,
      retryTime: 'retry-time',
    });

    const context = createMockExecutionContext({ userId: '1' });
    const next: CallHandler = { handle: () => of(true) };

    await expect(interceptor.intercept(context, next)).rejects.toThrow(
      new HttpException(
        `Too many requests. Please retry again later on retry-time.`,
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );
  });

  function createMockExecutionContext(query: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          query,
        }),
        getResponse: () => ({
          setHeader: jest.fn(),
        }),
      }),
    } as any;
  }
});
