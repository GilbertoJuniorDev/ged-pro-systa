import { Module as NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from '@ged/database';
import { DepartmentsRepository } from './departments.repository';
import { DepartmentsService, DEPARTMENT_REPOSITORY } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@NestModule({
  imports: [TypeOrmModule.forFeature([Department]), AuditLogsModule],
  controllers: [DepartmentsController],
  providers: [
    { provide: DEPARTMENT_REPOSITORY, useClass: DepartmentsRepository },
    DepartmentsService,
    RolesGuard,
  ],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
