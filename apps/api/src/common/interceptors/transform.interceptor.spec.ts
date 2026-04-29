import { of } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should wrap response in the standard envelope', (done) => {
    const mockData = { id: '1', title: 'Test' };
    const mockCallHandler: CallHandler = { handle: () => of(mockData) };
    const mockCtx = {} as ExecutionContext;

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((result) => {
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

    interceptor.intercept(mockCtx, mockCallHandler).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      done();
    });
  });
});
