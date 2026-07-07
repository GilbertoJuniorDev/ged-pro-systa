import { Module as NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department, Document, DocumentSeries, Dossie } from '@ged/database';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService, DOCUMENT_REPOSITORY } from './documents.service';
import { DocumentsController } from './documents.controller';
import { UploadDocumentUseCase } from './use-cases/upload-document.use-case';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { StorageModule } from '../storage/storage.module';

@NestModule({
  imports: [
    TypeOrmModule.forFeature([Document, Department, DocumentSeries, Dossie]),
    AuditLogsModule,
    StorageModule,
  ],
  controllers: [DocumentsController],
  providers: [
    { provide: DOCUMENT_REPOSITORY, useClass: DocumentsRepository },
    DocumentsService,
    UploadDocumentUseCase,
    RolesGuard,
  ],
  exports: [DocumentsService],
})
export class DocumentsModule {}
