import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ENV } from './config/env.config';
import cookieParser from 'cookie-parser';
import { loggerInstance, LoggerMiddleware } from './common/middlewares/logger';
import { NextFunction, Request, Response } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: loggerInstance,
  });

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());

  const loggerMiddleware = new LoggerMiddleware();
  app.use((req: Request, res: Response, next: NextFunction) =>
    loggerMiddleware.use(req, res, next),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  app.enableCors({
    origin: ENV.ALLOWED_ORIGINS,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Tradechat Backend API')
    .setDescription('Tradechat Backend API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  await app.listen(ENV.PORT);
}

void bootstrap();
