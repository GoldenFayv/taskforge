import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './utils/transform/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.APP_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  app.useGlobalPipes(new ValidationPipe({
    // whitelist
  }));
  app.useGlobalInterceptors(new TransformInterceptor())

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
