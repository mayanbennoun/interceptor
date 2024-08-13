import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'This is Exsersice used to Implment Rate Limit Interceptor : )';
  }
}
