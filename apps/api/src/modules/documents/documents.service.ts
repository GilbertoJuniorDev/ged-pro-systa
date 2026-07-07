import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DOCUMENT_FASE, DocumentSeries, Dossie } from '@ged/database';
import type { Confidencialidade } from '@ged/database';
import { STORAGE_SERVICE } from '../storage/interfaces/storage.interface';
import type { IStorageService } from '../storage/interfaces/storage.interface';
import { UploadDocumentUseCase } from './use-cases/upload-document.use-case';
import type { UploadDocumentData } from './use-cases/upload-document.use-case';
import { DocumentResponseDto } from './dto/document-response.dto';
import { DOCUMENT_REPOSITORY } from './interfaces/document-repository.interface';
import type {
  IDocumentRepository,
  DocumentQueryFilter,
  PaginatedDocuments,
  UpdateDocumentData,
} from './interfaces/document-repository.interface';

export { DOCUMENT_REPOSITORY };

// Shape of the data coming from UpdateDocumentDto (a plain, structurally-compatible
// object satisfies this — no need to import the DTO class itself into the service
// layer). `validade` is still an ISO date string here; `update()` converts it to a
// Date before delegating to the repository, same as UploadDocumentUseCase does for create.
export interface UpdateDocumentInputData {
  readonly nome?: string;
  readonly descricao?: string | null;
  readonly validade?: string | null;
  readonly confidencialidade?: Confidencialidade;
  readonly serieId?: string;
  readonly dossieId?: string | null;
  readonly isActive?: boolean;
}

function addMonths(date: Date, months: number): Date {
  // `date` columns come back from TypeORM as a UTC-midnight Date (e.g. new Date('2026-01-01')
  // is 2026-01-01T00:00:00.000Z). Using local getMonth/setMonth here would corrupt the
  // result on any server whose local timezone is behind UTC (this codebase deploys to
  // Brazil, UTC-3): the UTC midnight instant is the previous day locally, so adding months
  // via local calendar fields can silently roll the result forward by a day around
  // month-end boundaries. Operating in UTC keeps this deterministic regardless of server TZ.
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    @InjectRepository(DocumentSeries)
    private readonly documentSeriesRepo: Repository<DocumentSeries>,
    @InjectRepository(Dossie)
    private readonly dossieRepo: Repository<Dossie>,
  ) {}

  findAll(filter: DocumentQueryFilter): Promise<PaginatedDocuments> {
    return this.documentRepository.findAll(filter);
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }
    return document;
  }

  upload(dto: UploadDocumentData, file: Express.Multer.File): Promise<Document> {
    return this.uploadDocumentUseCase.execute(dto, file);
  }

  async update(id: string, data: UpdateDocumentInputData): Promise<Document> {
    const current = await this.findOne(id);

    if (data.serieId && data.serieId !== current.serieId) {
      const serie = await this.documentSeriesRepo.findOne({ where: { id: data.serieId } });
      if (!serie) {
        throw new BadRequestException('Série não encontrada');
      }
      if (serie.departamentoId !== current.departamentoId) {
        throw new BadRequestException(
          'A série deve pertencer ao mesmo departamento do documento',
        );
      }
    }

    if (data.dossieId && data.dossieId !== current.dossieId) {
      const dossie = await this.dossieRepo.findOne({ where: { id: data.dossieId } });
      if (!dossie) {
        throw new BadRequestException('Dossiê não encontrado');
      }
      if (dossie.departamentoId !== current.departamentoId) {
        throw new BadRequestException(
          'O dossiê deve pertencer ao mesmo departamento do documento',
        );
      }
    }

    const updateData: UpdateDocumentData = {
      nome: data.nome,
      descricao: data.descricao,
      validade: data.validade !== undefined ? (data.validade ? new Date(data.validade) : null) : undefined,
      confidencialidade: data.confidencialidade,
      serieId: data.serieId,
      dossieId: data.dossieId,
      isActive: data.isActive,
    };

    return this.documentRepository.update(id, updateData);
  }

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);
    // DB row is deleted first — a row pointing at a missing file would be a real bug,
    // so this must succeed before we touch storage.
    await this.documentRepository.delete(id);
    try {
      await this.storageService.delete(document.arquivoChave);
    } catch (error) {
      this.logger.warn(
        `Falha ao remover arquivo ${document.arquivoChave} do storage: ${(error as Error).message}`,
      );
    }
  }

  async transferir(id: string): Promise<Document> {
    const document = await this.findOne(id);
    if (document.fase !== DOCUMENT_FASE.CORRENTE) {
      throw new ConflictException('Documento não está na fase corrente');
    }
    return this.documentRepository.update(id, {
      fase: DOCUMENT_FASE.INTERMEDIARIO,
      faseIntermediarioDesde: new Date(),
    });
  }

  async getDownload(id: string): Promise<{ document: Document; stream: NodeJS.ReadableStream }> {
    const document = await this.findOne(id);
    const stream = await this.storageService.getStream(document.arquivoChave);
    return { document, stream };
  }

  toResponseDto(document: Document): DocumentResponseDto {
    if (!document.serie) {
      throw new Error(
        `Documento ${document.id} carregado sem a série associada (serieId=${document.serieId})`,
      );
    }
    const vencimentoCorrente = addMonths(
      document.faseCorrenteDesde,
      document.serie.prazoCorrenteMeses,
    );
    const vencimentoIntermediario = document.faseIntermediarioDesde
      ? addMonths(document.faseIntermediarioDesde, document.serie.prazoIntermediarioMeses)
      : null;
    const elegivelTransferencia =
      document.fase === DOCUMENT_FASE.CORRENTE && new Date() >= vencimentoCorrente;

    return new DocumentResponseDto({
      id: document.id,
      nome: document.nome,
      descricao: document.descricao,
      validade: document.validade,
      confidencialidade: document.confidencialidade,
      departamentoId: document.departamentoId,
      serieId: document.serieId,
      dossieId: document.dossieId,
      fase: document.fase,
      faseCorrenteDesde: document.faseCorrenteDesde,
      faseIntermediarioDesde: document.faseIntermediarioDesde,
      arquivoNome: document.arquivoNome,
      arquivoMimeType: document.arquivoMimeType,
      arquivoTamanho: document.arquivoTamanho,
      isActive: document.isActive,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      vencimentoCorrente,
      vencimentoIntermediario,
      elegivelTransferencia,
    });
  }
}
