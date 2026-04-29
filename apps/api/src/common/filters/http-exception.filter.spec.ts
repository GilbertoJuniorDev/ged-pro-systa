import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function makeHost(jsonMock: jest.Mock): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => ({
        status: (code: number) => ({ json: jsonMock.mockImplementation((body) => ({ code, body })) }),
      }),
    }),
  } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('should format a generic HttpException with code and message', () => {
    const jsonMock = jest.fn();
    const host = makeHost(jsonMock);
    const exception = new HttpException('Recurso não encontrado', HttpStatus.NOT_FOUND);

    filter.catch(exception, host);

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Recurso não encontrado',
        }),
        timestamp: expect.any(String),
      }),
    );
  });

  it('should extract message from object response body', () => {
    const jsonMock = jest.fn();
    const host = makeHost(jsonMock);
    const exception = new HttpException(
      { message: 'Email já cadastrado', error: 'Conflict' },
      HttpStatus.CONFLICT,
    );

    filter.catch(exception, host);

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          statusCode: HttpStatus.CONFLICT,
          message: 'Email já cadastrado',
        }),
      }),
    );
  });

  it('should include ISO timestamp in the response', () => {
    const jsonMock = jest.fn();
    const host = makeHost(jsonMock);
    const exception = new HttpException('Erro', HttpStatus.BAD_REQUEST);

    filter.catch(exception, host);

    const [calledWith] = jsonMock.mock.calls[0] as [{ timestamp: string }];
    expect(() => new Date(calledWith.timestamp)).not.toThrow();
    expect(calledWith.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
