import { Module as NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dossie, Department } from '@ged/database';
import { DossiesRepository } from './dossies.repository';
import { DossiesService, DOSSIE_REPOSITORY } from './dossies.service';
import { DossiesController } from './dossies.controller';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { UserDepartmentsModule } from '../user-departments/user-departments.module';
import { UserPermissionsModule } from '../user-permissions/user-permissions.module';

@NestModule({
  imports: [
    TypeOrmModule.forFeature([Dossie, Department]),
    AuditLogsModule,
    UserDepartmentsModule,
    UserPermissionsModule,
  ],
  controllers: [DossiesController],
  providers: [
    { provide: DOSSIE_REPOSITORY, useClass: DossiesRepository },
    DossiesService,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [DossiesService],
})
export class DossiesModule {}
