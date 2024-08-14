import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RateLimitInterceptor } from './Interceptors/rate-limit/rate-limit.interceptor';
import { RateLimitService } from './Interceptors/rate-limit/rate-limit.service';
import Redis from 'ioredis-mock';


describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService ,RateLimitService, 
        RateLimitInterceptor,
        {
          provide: 'RedisClient',
          useFactory: () => new Redis(),
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "This is rate-limit inerceptor, Every User is limited in the amount of requests per hour"', () => {
      expect(appController.getMainMessage()).toBe('This is rate-limit inerceptor, Every User is limited in the amount of requests per hour');
    });
  });
});
