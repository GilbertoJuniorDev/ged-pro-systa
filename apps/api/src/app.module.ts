import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ModulosModule } from './modules/modulos/modulos.module';
import { PermissoesModule } from './modules/permissoes/permissoes.module';
import { UsuarioPermissoesModule } from './modules/usuario-permissoes/usuario-permissoes.module';
import { PessoaFisicaModule } from './modules/pessoa-fisica/pessoa-fisica.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    ModulosModule,
    PermissoesModule,
    UsuarioPermissoesModule,
    PessoaFisicaModule,
    AuditLogsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    PermissionsGuard,
  ],
})
export class AppModule {}


