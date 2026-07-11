import { HttpExceptionFilter } from './http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  function createMockHost(url = '/test') {
    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    const getResponse = jest.fn().mockReturnValue({ status: statusMock });
    const getRequest = jest.fn().mockReturnValue({ url });

    const host = {
      switchToHttp: () => ({
        getResponse,
        getRequest,
      }),
    } as unknown as ArgumentsHost;

    return { host, statusMock, jsonMock };
  }

  it('should format HttpException with string response', () => {
    const { host, statusMock, jsonMock } = createMockHost();
    const exception = new HttpException('Bad Request error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Bad Request error',
        path: '/test',
      }),
    );
  });

  it('should format HttpException with object response', () => {
    const { host, statusMock, jsonMock } = createMockHost();
    const exception = new HttpException(
      { message: ['field invalid'], error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        message: ['field invalid'],
      }),
    );
  });

  it('should format HttpException with object response missing message and error properties', () => {
    const { host, statusMock, jsonMock } = createMockHost();
    const exception = new HttpException(
      { foo: 'bar' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'Http Exception',
      }),
    );
  });

  it('should format generic Error in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const { host, statusMock, jsonMock } = createMockHost();

    filter.catch(new Error('Unexpected error'), host);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Unexpected error',
      }),
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should format generic Error in production concealing details', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const { host, statusMock, jsonMock } = createMockHost();

    filter.catch(new Error('Unexpected error'), host);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
      }),
    );

    process.env.NODE_ENV = originalEnv;
  });
});
