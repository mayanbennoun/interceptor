import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { RateLimitInterceptor } from './rate-limit.interceptor';
import { RateLimitService } from './rate-limit.service';
import Redis from 'ioredis-mock';

describe('RateLimitInterceptor', () => {
  let interceptor: RateLimitInterceptor;
  let rateLimitService: RateLimitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitInterceptor,
        RateLimitService,
        {
          provide: 'RedisClient',
          useClass: Redis,
        },
      ],
    }).compile();

    interceptor = module.get<RateLimitInterceptor>(RateLimitInterceptor);
    rateLimitService = module.get<RateLimitService>(RateLimitService);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should allow requests when not rate limited', (done) => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-client-id': 'test-client' } }),
        getResponse: () => ({ header: jest.fn() }),
      }),
    } as ExecutionContext;

    const next: CallHandler = {
      handle: () => of('test'),
    };

    jest.spyOn(rateLimitService, 'isRateLimited').mockResolvedValue({ isLimited: false, remainingRequests: 99 });

    interceptor.intercept(context, next).subscribe({
      next: (value) => {
        expect(value).toBe('test');
        done();
      },
      error: done,
    });
  });

  it('should throw an exception when rate limited', (done) => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-client-id': 'test-client' } }),
        getResponse: () => ({ header: jest.fn() }),
      }),
    } as ExecutionContext;

    const next: CallHandler = {
      handle: () => of('test'),
    };

    jest.spyOn(rateLimitService, 'isRateLimited').mockResolvedValue({ isLimited: true, remainingRequests: 0, retryAfter: 3600 });

    interceptor.intercept(context, next).subscribe({
      error: (error) => {
        expect(error.getStatus()).toBe(429);
        expect(error.message).toBe('Too Many Requests');
        done();
      },
    });
  });
});