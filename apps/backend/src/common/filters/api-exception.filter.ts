import {
  Catch,
  HttpStatus,
  HttpException,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import type { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const message =
      typeof body === 'string'
        ? body
        : (body as { message?: string | string[] }).message;

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message : (message ?? 'Error'),
      timestamp: new Date().toISOString(),
    });
  }
}
