import { of } from 'rxjs';
import { StreamableFile, type ExecutionContext, type CallHandler } from '@nestjs/common';
import { TransformInterceptor, type ApiResponse } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should wrap response in the standard envelope', (done) => {
    const mockData = { id: '1', title: 'Test' };
    const mockCallHandler: CallHandler = { handle: () => of(mockData) };
    const mockCtx = {} as ExecutionContext;

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((raw) => {
      const result = raw as ApiResponse<unknown>;
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.message).toBe('Operação realizada com sucesso');
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
      done();
    });
  });

  it('should wrap null data without error', (done) => {
    const mockCallHandler: CallHandler = { handle: () => of(null) };
    const mockCtx = {} as ExecutionContext;

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((raw) => {
      const result = raw as ApiResponse<unknown>;
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      done();
    });
  });

  it('should pass through a StreamableFile unwrapped', (done) => {
    const file = new StreamableFile(Buffer.from('conteudo'));
    const mockCallHandler: CallHandler = { handle: () => of(file) };
    const mockCtx = {} as ExecutionContext;

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((result) => {
      expect(result).toBe(file);
      done();
    });
  });
});
