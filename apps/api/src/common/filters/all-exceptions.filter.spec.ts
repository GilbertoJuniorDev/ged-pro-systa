import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ErrorLogsService } from '../../modules/error-logs/error-logs.service';
import {
  ERROR_LOG_LEVEL,
  ERROR_LOG_SOURCE,
} from '../../modules/error-logs/schemas/error-log.schema';

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}

function buildHost(
  request: Record<string, unknown>,
  response: MockResponse,
): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
      getNext: () => undefined,
    }),
  } as unknown as ArgumentsHost;
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let errorLogsService: jest.Mocked<Pick<ErrorLogsService, 'log'>>;
  let response: MockResponse;
  let request: Record<string, unknown>;

  beforeEach(() => {
    errorLogsService = { log: jest.fn().mockResolvedValue(undefined) };
    filter = new AllExceptionsFilter(
      errorLogsService as unknown as ErrorLogsService,
    );

    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    request = {
      method: 'GET',
      url: '/test',
      originalUrl: '/test',
      headers: { 'user-agent': 'jest', 'x-request-id': 'req-1' },
      ip: '127.0.0.1',
      user: { sub: 'user-1', email: 'u@test.com' },
    };

    // Silence logger noise from filter internals
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should respond with standard error contract for HttpException', () => {
    const exc = new NotFoundException('Not found');

    filter.catch(exc, buildHost(request, response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const payload = response.json.mock.calls[0]?.[0] as {
      success: boolean;
      error: { code: string; message: string; statusCode: number };
      timestamp: string;
    };
    expect(payload.success).toBe(false);
    expect(payload.error.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(payload.error.code).toBe('NOTFOUND');
    expect(payload.error.message).toBe('Not found');
    expect(typeof payload.timestamp).toBe('string');
  });

  it('should classify HttpException < 500 as warn level', () => {
    filter.catch(new NotFoundException('x'), buildHost(request, response));

    expect(errorLogsService.log).toHaveBeenCalledTimes(1);
    const arg = errorLogsService.log.mock.calls[0]?.[0];
    expect(arg?.level).toBe(ERROR_LOG_LEVEL.WARN);
    expect(arg?.source).toBe(ERROR_LOG_SOURCE.API);
    expect(arg?.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('should classify HttpException >= 500 as error level', () => {
    const exc = new HttpException(
      'boom',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    filter.catch(exc, buildHost(request, response));

    const arg = errorLogsService.log.mock.calls[0]?.[0];
    expect(arg?.level).toBe(ERROR_LOG_LEVEL.ERROR);
    expect(arg?.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('should classify non-HTTP exceptions as fatal with statusCode 500', () => {
    const err = new Error('crash');

    filter.catch(err, buildHost(request, response));

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const arg = errorLogsService.log.mock.calls[0]?.[0];
    expect(arg?.level).toBe(ERROR_LOG_LEVEL.FATAL);
    expect(arg?.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(arg?.code).toBe('INTERNAL_SERVER_ERROR');
    expect(arg?.stack).toBe(err.stack);
  });

  it('should include request metadata (method, url, ip, userAgent, requestId, userId, userEmail)', () => {
    filter.catch(new NotFoundException('x'), buildHost(request, response));

    const arg = errorLogsService.log.mock.calls[0]?.[0];
    expect(arg?.method).toBe('GET');
    expect(arg?.url).toBe('/test');
    expect(arg?.ip).toBe('127.0.0.1');
    expect(arg?.userAgent).toBe('jest');
    expect(arg?.requestId).toBe('req-1');
    expect(arg?.userId).toBe('user-1');
    expect(arg?.userEmail).toBe('u@test.com');
  });

  it('should not throw when errorLogsService.log rejects (fail-safe)', () => {
    errorLogsService.log.mockRejectedValueOnce(new Error('mongo down'));

    expect(() =>
      filter.catch(new NotFoundException('x'), buildHost(request, response)),
    ).not.toThrow();
  });
});
