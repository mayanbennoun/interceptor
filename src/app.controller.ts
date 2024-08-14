import { Controller, Get, Headers, BadRequestException, UseInterceptors,Query } from '@nestjs/common';
import { AppService } from './app.service';
import { RateLimitInterceptor } from './rate-limit/rate-limit.interceptor';

@UseInterceptors(RateLimitInterceptor)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // @Get('handle-request')
  // handleRequest(@Headers('user-id') userId: string): string {
  //   console.log('user id',userId); // Log all headers
  //   if (!userId) {
  //     throw new BadRequestException('User ID is required to complete request');
  //   }
  //   return `User ID: ${userId}, Message: ${this.appService.getHello()}`;
  // }

  @Get('handle-request')
  handleRequest(@Query('userId') userId: string): string {
    return `User ID: ${userId}, Message: ${this.appService.getHello()}`;
  }
}
