import { Module as NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Arquivo, ArquivoDepartment, Department, Dossie } from '@ged/database';
import { ArquivosRepository } from './arquivos.repository';
import { ArquivosService, ARQUIVO_REPOSITORY } from './arquivos.service';
import { ArquivosController } from './arquivos.controller';
import { CreateArquivoUseCase } from './use-cases/create-arquivo.use-case';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { UserDepartmentsModule } from '../user-departments/user-departments.module';
import { UserPermissionsModule } from '../user-permissions/user-permissions.module';

@NestModule({
  imports: [
    TypeOrmModule.forFeature([Arquivo, ArquivoDepartment, Department, Dossie]),
    AuditLogsModule,
    UserDepartmentsModule,
    UserPermissionsModule,
  ],
  controllers: [ArquivosController],
  providers: [
    { provide: ARQUIVO_REPOSITORY, useClass: ArquivosRepository },
    ArquivosService,
    CreateArquivoUseCase,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [ArquivosService],
})
export class ArquivosModule {}
