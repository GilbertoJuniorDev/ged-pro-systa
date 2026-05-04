import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtPayload } from '@ged/types';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { Role } from '@ged/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const { user } = request;

    if (!user) {
      throw new ForbiddenException('Acesso negado');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException('Acesso negado: permissão insuficiente');
    }

    return true;
  }
}
