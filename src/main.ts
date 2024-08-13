import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RateLimitInterceptor } from './rate-limit.interceptor';


// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(3000);
// }
// bootstrap();

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const rateLimitInterceptor = app.get(RateLimitInterceptor);
  app.useGlobalInterceptors(rateLimitInterceptor);
  await app.listen(3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();