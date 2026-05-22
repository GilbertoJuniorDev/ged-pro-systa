import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { MongoDatabaseModule } from './database/mongo-database.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ModulesModule } from './modules/modules/modules.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { UserPermissionsModule } from './modules/user-permissions/user-permissions.module';
import { PhysicalPersonModule } from './modules/physical-person/physical-person.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { ErrorLogsModule } from './modules/error-logs/error-logs.module';
import { CompanyModule } from './modules/company/company.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { SystemModule } from './modules/system/system.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    DatabaseModule,
    MongoDatabaseModule,
    UsersModule,
    AuthModule,
    ModulesModule,
    PermissionsModule,
    UserPermissionsModule,
    PhysicalPersonModule,
    AuditLogsModule,
    ErrorLogsModule,
    CompanyModule,
    SubscriptionModule,
    SystemModule,
    SystemSettingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    PermissionsGuard,
  ],
})
export class AppModule {}


