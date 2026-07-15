import { Module as NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Department,
  Document,
  DocumentAccessDepartment,
  DocumentAccessUser,
  DocumentSeries,
  Dossie,
} from '@ged/database';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService, DOCUMENT_REPOSITORY } from './documents.service';
import { DocumentsController } from './documents.controller';
import { UploadDocumentUseCase } from './use-cases/upload-document.use-case';
import { ApplyDocumentConfidentialityUseCase } from './use-cases/apply-document-confidentiality.use-case';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { StorageModule } from '../storage/storage.module';
import { UserDepartmentsModule } from '../user-departments/user-departments.module';
import { UserPermissionsModule } from '../user-permissions/user-permissions.module';

@NestModule({
  imports: [
    TypeOrmModule.forFeature([
      Document,
      Department,
      DocumentSeries,
      Dossie,
      DocumentAccessDepartment,
      DocumentAccessUser,
    ]),
    AuditLogsModule,
    StorageModule,
    UserDepartmentsModule,
    UserPermissionsModule,
  ],
  controllers: [DocumentsController],
  providers: [
    { provide: DOCUMENT_REPOSITORY, useClass: DocumentsRepository },
    DocumentsService,
    UploadDocumentUseCase,
    ApplyDocumentConfidentialityUseCase,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
