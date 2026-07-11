import { TransformInterceptor } from './transform.interceptor';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    interceptor = new TransformInterceptor(reflector);
  });

  function createMockContext(statusCode = 200) {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getResponse: () => ({ statusCode }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should skip transformation when SKIP_TRANSFORM_KEY is true', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const context = createMockContext();
    const next: CallHandler = {
      handle: () => of({ foo: 'bar' }),
    };

    interceptor.intercept(context, next).subscribe({
      next: (val) => {
        expect(val).toEqual({ foo: 'bar' });
        done();
      },
    });
  });

  it('should wrap response with statusCode and data when not skipped', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = createMockContext(201);
    const next: CallHandler = {
      handle: () => of({ id: 123 }),
    };

    interceptor.intercept(context, next).subscribe({
      next: (val) => {
        expect(val).toEqual({
          statusCode: 201,
          data: { id: 123 },
        });
        done();
      },
    });
  });
});
