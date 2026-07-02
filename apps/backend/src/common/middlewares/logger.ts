import type { LoggerService } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import morgan from 'morgan';
import { WinstonLogger, utilities } from 'nest-winston';
import winston from 'winston';

const winstonLogger = winston.createLogger({
  transports: [
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
