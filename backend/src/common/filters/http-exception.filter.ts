import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Global HTTP exception filter — standardises ALL error responses:
 *
 * {
 *   "statusCode": 400,
 *   "error": "Bad Request",
 *   "message": "url must be a URL address",
 *   "timestamp": "2026-07-10T23:00:00.000Z",
 *   "path": "/videos/import"
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (isHttp) {
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const body = responseBody as Record<string, unknown>;
        message = (body['message'] as string | string[]) ?? exception.message;
        error = (body['error'] as string) ?? HttpStatus[status];
      }
    } else if (exception instanceof Error) {
      // Hide internal error details from clients in production
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
      }
    }

    // Normalise error label
    if (!error || error === 'Internal Server Error') {
      error = HttpStatus[status]?.replace(/_/g, ' ') ?? 'Error';
    }

    res.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }
}
