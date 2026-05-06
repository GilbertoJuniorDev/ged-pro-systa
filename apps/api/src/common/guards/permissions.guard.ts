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

export const USUARIO_PERMISSOES_SERVICE = 'USUARIO_PERMISSOES_SERVICE';

export interface IPermissaoChecker {
  hasPermissao(usuarioId: string, nomePermissao: string): Promise<boolean>;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(USUARIO_PERMISSOES_SERVICE)
    private readonly permissaoChecker: IPermissaoChecker,
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
      throw new ForbiddenException('Acesso negado');
    }

    // ADMIN tem bypass total
    if (user.role === ROLE.ADMIN) {
      return true;
    }

    const results = await Promise.all(
      requiredPermissions.map((nome) =>
        this.permissaoChecker.hasPermissao(user.sub, nome),
      ),
    );

    const hasAll = results.every(Boolean);

    if (!hasAll) {
      throw new ForbiddenException('Acesso negado: permissão insuficiente');
    }

    return true;
  }
}
