import { Controller, Get, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';

@Controller('rate-limit')
export class RateLimitController {
  constructor(private readonly rateLimitService: RateLimitService) {}

  @Get('check')
  async checkRateLimit(@Headers('userId') userId: string) {
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    const result = await this.rateLimitService.isRateLimited(userId);
    return {
      isLimited: result.isLimited,
      remainingRequests: result.remainingRequests,
      retryAfter: result.retryAfter
    };
  }
}