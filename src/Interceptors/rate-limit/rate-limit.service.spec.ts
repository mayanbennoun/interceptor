import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from './rate-limit.service';
import Redis from 'ioredis-mock';
import {
  rateLimitServiceProvider,
  redisMockProvider,
} from '../../../test/mocks';

describe('RateLimitService', () => {
  let rateLimitService: RateLimitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [redisMockProvider, rateLimitServiceProvider],
    }).compile();

    rateLimitService = module.get(RateLimitService);
  });

  it('should return remaining requests and not be limited on the first request', async () => {
    const userId = '1';
    const result = await rateLimitService.enforceRequestLimit(userId);
    expect(result.isLimited).toBe(false);
    expect(result.remainingRequests).toBe(2); // 3 - 1
  });

  it('should limit after exceeding the request limit', async () => {
    const userId = '2';

    await rateLimitService.enforceRequestLimit(userId); // 1st request
    await rateLimitService.enforceRequestLimit(userId); // 2nd request
    await rateLimitService.enforceRequestLimit(userId); // 3rd request
    const result = await rateLimitService.enforceRequestLimit(userId); // 4th request

    expect(result.isLimited).toBe(true);
    expect(result.remainingRequests).toBe(0);
  });

  it('should set retry time correctly after the limit is exceeded', async () => {
    const userId = '3';

    await rateLimitService.enforceRequestLimit(userId); // 1st request
    await rateLimitService.enforceRequestLimit(userId); // 2nd request
    await rateLimitService.enforceRequestLimit(userId); // 3rd request
    const result = await rateLimitService.enforceRequestLimit(userId); // 4th request

    expect(result.isLimited).toBe(true);
    expect(result.retryTime).toBeDefined();
  });
});
