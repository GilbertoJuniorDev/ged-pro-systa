import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

export const USER_PERMISSIONS_SERVICE = 'USER_PERMISSIONS_SERVICE';

export interface IPermissionChecker {
  hasPermission(userId: string, permissionName: string): Promise<boolean>;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(USER_PERMISSIONS_SERVICE)
    private readonly permissionChecker: IPermissionChecker,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const { user } = request;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // SUPER_ADMIN e ADMIN têm bypass total — mesma regra do RolesGuard.
    if (user.role === ROLE.SUPER_ADMIN || user.role === ROLE.ADMIN) {
      return true;
    }

    const results = await Promise.all(
      requiredPermissions.map((nome) =>
        this.permissionChecker.hasPermission(user.sub, nome),
      ),
    );

    const hasAll = results.every(Boolean);

    if (!hasAll) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    return true;
  }
}
