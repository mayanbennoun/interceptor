import {
  Controller,
  Get,
  BadRequestException,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';
import { RateLimitInterceptor } from './Interceptors/rate-limit/rate-limit.interceptor';

@UseInterceptors(RateLimitInterceptor)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getMainMessage(): string {
    return this.appService.getMessage();
  }

  @Get('handle-request')
  handleRequest(@Query('userId') userId: string): string {
    if (!userId) {
      throw new BadRequestException('User ID is required to complete request');
    }
    return `User ID: ${userId}, Message: ${this.appService.getMessage()}`;
  }
}
