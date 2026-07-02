import { Test, type TestingModule } from '@nestjs/testing';
import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';

const makeContext = (user: Partial<JwtPayload>): ExecutionContext => {
  const mockHandler = jest.fn();
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => mockHandler,
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
};

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: reflector }],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('should return true when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = makeContext({ sub: 'u1', role: ROLE.VIEWER, email: 'a@b.com' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should return true when user role matches one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([ROLE.ADMIN, ROLE.MANAGER]);
    const ctx = makeContext({ sub: 'manager-1', role: ROLE.MANAGER, email: 'm@b.com' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException when user role does not match required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([ROLE.ADMIN]);
    const ctx = makeContext({ sub: 'viewer-1', role: ROLE.VIEWER, email: 'v@b.com' });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should return true for SUPER_ADMIN even when required roles are ["ADMIN"]', () => {
    reflector.getAllAndOverride.mockReturnValue([ROLE.ADMIN]);
    const ctx = makeContext({ sub: 'super-admin-1', role: ROLE.SUPER_ADMIN, email: 's@b.com' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should return true for SUPER_ADMIN even when required roles are ["MANAGER"]', () => {
    reflector.getAllAndOverride.mockReturnValue([ROLE.MANAGER]);
    const ctx = makeContext({ sub: 'super-admin-1', role: ROLE.SUPER_ADMIN, email: 's@b.com' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException when user is not authenticated', () => {
    reflector.getAllAndOverride.mockReturnValue([ROLE.ADMIN]);
    const ctx = makeContext({} as JwtPayload);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
