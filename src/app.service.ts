import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getMessage(): string {
    return 'This is rate-limit inerceptor, Every User is limited in the amount of requests per hour';
  }
}
