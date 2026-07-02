import { Test, type TestingModule } from '@nestjs/testing';
import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard, USER_PERMISSIONS_SERVICE } from './permissions.guard';
import type { IPermissionChecker } from './permissions.guard';
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

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;
  let mockChecker: jest.Mocked<IPermissionChecker>;

  beforeEach(async () => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    mockChecker = {
      hasPermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        { provide: Reflector, useValue: reflector },
        { provide: USER_PERMISSIONS_SERVICE, useValue: mockChecker },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
  });

  it('should return true when no permissions are required', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = makeContext({ sub: 'u1', role: ROLE.VIEWER, email: 'a@b.com' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(mockChecker.hasPermission).not.toHaveBeenCalled();
  });

  it('should return true for SUPER_ADMIN regardless of permissions', async () => {
    reflector.getAllAndOverride.mockReturnValue(['documents:delete']);
    const ctx = makeContext({ sub: 'super-admin-1', role: ROLE.SUPER_ADMIN, email: 'a@b.com' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(mockChecker.hasPermission).not.toHaveBeenCalled();
  });

  it('should NOT bypass for ADMIN and should go through hasPermission check', async () => {
    reflector.getAllAndOverride.mockReturnValue(['documents:delete']);
    mockChecker.hasPermission.mockResolvedValue(true);
    const ctx = makeContext({ sub: 'admin-1', role: ROLE.ADMIN, email: 'a@b.com' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(mockChecker.hasPermission).toHaveBeenCalledTimes(1);
  });

  it('should return true when VIEWER has all required permissions', async () => {
    reflector.getAllAndOverride.mockReturnValue(['documents:read', 'categories:read']);
    mockChecker.hasPermission.mockResolvedValue(true);
    const ctx = makeContext({ sub: 'viewer-1', role: ROLE.VIEWER, email: 'v@b.com' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(mockChecker.hasPermission).toHaveBeenCalledTimes(2);
  });

  it('should throw ForbiddenException when VIEWER is missing a permission', async () => {
    reflector.getAllAndOverride.mockReturnValue(['documents:read', 'documents:delete']);
    mockChecker.hasPermission
      .mockResolvedValueOnce(true)   // documents:read ✓
      .mockResolvedValueOnce(false); // documents:delete ✗
    const ctx = makeContext({ sub: 'viewer-1', role: ROLE.VIEWER, email: 'v@b.com' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user is not authenticated', async () => {
    reflector.getAllAndOverride.mockReturnValue(['documents:read']);
    const ctx = makeContext({} as JwtPayload); // sem sub/role

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
