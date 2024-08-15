import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitService } from './rate-limit.service';
import {
  rateLimitServiceProvider,
  redisMockProvider,
} from '../../../test/mocks';

describe('RateLimitService', () => {
  let rateLimitService: RateLimitService;

  // Initializes the RateLimitService instance with mock providers for Redis.
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [redisMockProvider, rateLimitServiceProvider],
    }).compile();

    rateLimitService = module.get(RateLimitService);
  });

  // Test case to verify that the service returns the correct remaining requests and is not limited on the first request.
  it('should return remaining requests and not be limited on the first request', async () => {
    const userId = '1';
    const result = await rateLimitService.enforceRequestLimit(userId);
    expect(result.isLimited).toBe(false);
    expect(result.remainingRequests).toBe(2); // 3 - 1
  });

  // Test case to verify that the service correctly limits a user after they exceed the allowed number of requests.
  it('should limit after exceeding the request limit', async () => {
    const userId = '2';

    await rateLimitService.enforceRequestLimit(userId); // 1st request
    await rateLimitService.enforceRequestLimit(userId); // 2nd request
    await rateLimitService.enforceRequestLimit(userId); // 3rd request
    const result = await rateLimitService.enforceRequestLimit(userId); // 4th request

    expect(result.isLimited).toBe(true);
    expect(result.remainingRequests).toBe(0);
  });

  // Test case to verify that the retry time is correctly set after a user exceeds their request limit.
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
