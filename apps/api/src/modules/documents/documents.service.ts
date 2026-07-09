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
import { Document, DOCUMENT_FASE, DocumentSeries, Dossie, ROLE } from '@ged/database';
import type { Confidencialidade, Role } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { STORAGE_SERVICE } from '../storage/interfaces/storage.interface';
import type { IStorageService } from '../storage/interfaces/storage.interface';
import { UserDepartmentsService } from '../user-departments/user-departments.service';
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
  readonly destaque?: boolean;
  readonly exigeCadastro?: boolean;
}

// Papéis que enxergam todos os documentos, sem restrição por departamento.
const PRIVILEGED_ROLES: readonly Role[] = [ROLE.SUPER_ADMIN, ROLE.ADMIN, ROLE.MANAGER];

function addMonths(date: Date | string, months: number): Date {
  // `date` columns come back from TypeORM/pg as 'YYYY-MM-DD' strings (only when a value was
  // just set in memory is it still a real Date). Both `new Date('2026-01-01')` and a Date
  // already at UTC-midnight give the same UTC calendar day, so normalize to a Date first.
  const base = typeof date === 'string' ? new Date(date) : date;
  // Using local getMonth/setMonth here would corrupt the result on any server whose local
  // timezone is behind UTC (this codebase deploys to Brazil, UTC-3): the UTC midnight instant
  // is the previous day locally, so adding months via local calendar fields can silently roll
  // the result forward by a day around month-end boundaries. Operating in UTC keeps this
  // deterministic regardless of server TZ.
  const result = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()),
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
    private readonly userDepartmentsService: UserDepartmentsService,
  ) {}

  // Retorna null para papéis privilegiados (sem restrição). Caso contrário, a lista de
  // departamentoIds aos quais o usuário está vinculado (pode ser vazia).
  private async resolveAllowedDepartamentos(
    user: JwtPayload,
  ): Promise<readonly string[] | null> {
    if (PRIVILEGED_ROLES.includes(user.role)) {
      return null;
    }
    const departments = await this.userDepartmentsService.findByUserId(user.sub);
    return departments.map((department) => department.departamentoId);
  }

  // Não vaza existência: usuário sem acesso recebe 404 (igual a documento inexistente).
  private async assertCanAccess(document: Document, user: JwtPayload): Promise<void> {
    const allowed = await this.resolveAllowedDepartamentos(user);
    if (allowed === null) {
      return;
    }
    if (!allowed.includes(document.departamentoId)) {
      throw new NotFoundException('Documento não encontrado');
    }
  }

  async findAll(filter: DocumentQueryFilter, user: JwtPayload): Promise<PaginatedDocuments> {
    const allowed = await this.resolveAllowedDepartamentos(user);
    if (allowed !== null && allowed.length === 0) {
      // Usuário não-privilegiado sem nenhum departamento não enxerga documento algum.
      const page = filter.page ?? 1;
      const limit = Math.min(filter.limit ?? 20, 100);
      return { data: [], total: 0, page, limit };
    }
    return this.documentRepository.findAll({
      ...filter,
      allowedDepartamentoIds: allowed ?? undefined,
    });
  }

  // `user` é opcional para preservar o caminho de escrita (update/remove/transferir), que
  // já é restrito a ADMIN/MANAGER pelo RolesGuard e carrega o documento sem checagem de
  // escopo. Quando `user` é fornecido (leitura), o acesso por departamento é validado.
  async findOne(id: string, user?: JwtPayload): Promise<Document> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }
    if (user) {
      await this.assertCanAccess(document, user);
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
      destaque: data.destaque,
      exigeCadastro: data.exigeCadastro,
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

  async getDownload(
    id: string,
    user: JwtPayload,
  ): Promise<{ document: Document; stream: NodeJS.ReadableStream }> {
    // findOne(id, user) já aplica assertCanAccess — download herda o mesmo escopo.
    const document = await this.findOne(id, user);
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
      destaque: document.destaque,
      exigeCadastro: document.exigeCadastro,
    });
  }
}
