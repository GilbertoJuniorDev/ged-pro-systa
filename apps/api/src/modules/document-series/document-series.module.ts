import { Module as NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentSeries, Department } from '@ged/database';
import { DocumentSeriesRepository } from './document-series.repository';
import {
  DocumentSeriesService,
  DOCUMENT_SERIES_REPOSITORY,
} from './document-series.service';
import { DocumentSeriesController } from './document-series.controller';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { UserDepartmentsModule } from '../user-departments/user-departments.module';
import { UserPermissionsModule } from '../user-permissions/user-permissions.module';

@NestModule({
  imports: [
    TypeOrmModule.forFeature([DocumentSeries, Department]),
    AuditLogsModule,
    UserDepartmentsModule,
    UserPermissionsModule,
  ],
  controllers: [DocumentSeriesController],
  providers: [
    { provide: DOCUMENT_SERIES_REPOSITORY, useClass: DocumentSeriesRepository },
    DocumentSeriesService,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [DocumentSeriesService],
})
export class DocumentSeriesModule {}
