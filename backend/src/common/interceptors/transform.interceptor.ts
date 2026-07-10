import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator';

export interface StandardResponse<T> {
  statusCode: number;
  data: T;
}

/**
 * Global response interceptor — wraps all successful responses:
 *
 * {
 *   "statusCode": 200,
 *   "data": { ... }
 * }
 *
 * Routes decorated with @SkipTransform() bypass this wrapper.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) return next.handle();

    const statusCode = context.switchToHttp().getResponse().statusCode as number;

    return next.handle().pipe(
      map((data) => ({
        statusCode,
        data,
      })),
    );
  }
}
