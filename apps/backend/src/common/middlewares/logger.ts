import type { LoggerService } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import morgan from 'morgan';
import { utilities, WinstonLogger } from 'nest-winston';
import winston from 'winston';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import { ENV } from 'src/config/env.config';

const logtail = new Logtail(ENV.LOGTAIL_SOURCE_TOKEN, {
  endpoint: ENV.LOGTAIL_INGESTING_HOST,
});

const winstonLogger = winston.createLogger({
  transports: [
    new LogtailTransport(logtail),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        utilities.format.nestLike('tradechat-backend', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),
  ],
});

export const loggerInstance: LoggerService = new WinstonLogger(winstonLogger);

export class LoggerMiddleware implements NestMiddleware {
  private readonly logger: RequestHandler = morgan('dev');

  use(req: Request, res: Response, next: NextFunction) {
    this.logger(req, res, next);
  }
}
