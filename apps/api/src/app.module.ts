import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ModulesModule } from './modules/modules/modules.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { UserPermissionsModule } from './modules/user-permissions/user-permissions.module';
import { PhysicalPersonModule } from './modules/physical-person/physical-person.module';
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
    ModulesModule,
    PermissionsModule,
    UserPermissionsModule,
    PhysicalPersonModule,
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


