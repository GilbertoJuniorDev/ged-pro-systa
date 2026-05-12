import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPermission } from '@ged/database';
import { UserPermissionsRepository } from './user-permissions.repository';
import {
  UserPermissionsService,
  USER_PERMISSIONS_REPOSITORY,
} from './user-permissions.service';
import { UserPermissionsController } from './user-permissions.controller';
import { RolesGuard } from '../../common/guards/roles.guard';
import { USER_PERMISSIONS_SERVICE } from '../../common/guards/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserPermission]), AuditLogsModule],
  controllers: [UserPermissionsController],
  providers: [
    { provide: USER_PERMISSIONS_REPOSITORY, useClass: UserPermissionsRepository },
    UserPermissionsService,
    { provide: USER_PERMISSIONS_SERVICE, useExisting: UserPermissionsService },
    RolesGuard,
  ],
  exports: [UserPermissionsService, USER_PERMISSIONS_SERVICE],
})
export class UserPermissionsModule {}
