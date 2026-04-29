import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

function makeExecutionContext(
  handlerMetadata: boolean | undefined,
  classMetadata: boolean | undefined,
): ExecutionContext {
  return {
    getHandler: () => ({ name: 'testHandler' }),
    getClass: () => ({ name: 'TestController' }),
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization: 'Bearer token' } }),
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };

    guard = new JwtAuthGuard(reflector as unknown as Reflector);
  });

  it('should return true when route is marked as @Public()', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = makeExecutionContext(true, false);

    const result = guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      expect.anything(),
      expect.anything(),
    ]);
  });

  it('should delegate to AuthGuard when route is not @Public()', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const ctx = makeExecutionContext(false, false);

    // AuthGuard('jwt').canActivate invoca o passport — mockamos o super
    const superCanActivate = jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
      .mockReturnValue(true);

    guard.canActivate(ctx);

    expect(superCanActivate).toHaveBeenCalledWith(ctx);
    superCanActivate.mockRestore();
  });
});
