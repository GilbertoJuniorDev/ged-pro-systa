import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '@ged/database';
import { PermissionsRepository } from './permissions.repository';
import { PermissionsService, PERMISSION_REPOSITORY } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Permission]), AuditLogsModule],
  controllers: [PermissionsController],
  providers: [
    { provide: PERMISSION_REPOSITORY, useClass: PermissionsRepository },
    PermissionsService,
    RolesGuard,
  ],
  exports: [PermissionsService],
})
export class PermissionsModule {}
