import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioPermissao } from '@ged/database';
import { UsuarioPermissoesRepository } from './usuario-permissoes.repository';
import {
  UsuarioPermissoesService,
  USUARIO_PERMISSAO_REPOSITORY,
} from './usuario-permissoes.service';
import { UsuarioPermissoesController } from './usuario-permissoes.controller';
import { RolesGuard } from '../../common/guards/roles.guard';
import { USUARIO_PERMISSOES_SERVICE } from '../../common/guards/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioPermissao]), AuditLogsModule],
  controllers: [UsuarioPermissoesController],
  providers: [
    { provide: USUARIO_PERMISSAO_REPOSITORY, useClass: UsuarioPermissoesRepository },
    UsuarioPermissoesService,
    { provide: USUARIO_PERMISSOES_SERVICE, useExisting: UsuarioPermissoesService },
    RolesGuard,
  ],
  exports: [UsuarioPermissoesService, USUARIO_PERMISSOES_SERVICE],
})
export class UsuarioPermissoesModule {}
