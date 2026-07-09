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
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { UserDepartmentsModule } from '../user-departments/user-departments.module';

@NestModule({
  imports: [
    TypeOrmModule.forFeature([DocumentSeries, Department]),
    AuditLogsModule,
    UserDepartmentsModule,
  ],
  controllers: [DocumentSeriesController],
  providers: [
    { provide: DOCUMENT_SERIES_REPOSITORY, useClass: DocumentSeriesRepository },
    DocumentSeriesService,
    RolesGuard,
  ],
  exports: [DocumentSeriesService],
})
export class DocumentSeriesModule {}
