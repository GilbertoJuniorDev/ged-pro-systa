import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CONFIDENCIALIDADE,
  Department,
  Document,
  DOCUMENT_FASE,
  DocumentSeries,
  Dossie,
} from '@ged/database';
import { STORAGE_SERVICE } from '../../storage/interfaces/storage.interface';
import type { IStorageService } from '../../storage/interfaces/storage.interface';
import { DOCUMENT_REPOSITORY } from '../interfaces/document-repository.interface';
import type { IDocumentRepository } from '../interfaces/document-repository.interface';

// Input shape for this use-case: raw fields coming straight off CreateDocumentDto
// (multipart text fields, so `validade` is still an ISO date string here, not a Date).
// Deliberately named differently from the repository's CreateDocumentData (which takes
// a Date for validade and includes the derived fase/arquivo fields) to avoid confusing
// the two shapes.
export interface UploadDocumentData {
  readonly nome: string;
  readonly descricao?: string | null;
  readonly validade?: string | null;
  // Optional here (mirrors CreateDocumentDto, see Task 4) — defaults to RESTRITO below,
  // same as the column default on Document. Task 6 replaces this default with the real
  // ApplyDocumentConfidentialityUseCase authorization/grant flow; this is a stopgap so the
  // type stays consistent with the DTO in the meantime.
  readonly confidencialidade?: Document['confidencialidade'];
  readonly departamentoId: string;
  readonly serieId: string;
  readonly dossieId?: string | null;
  readonly destaque?: boolean;
  readonly exigeCadastro?: boolean;
}

@Injectable()
export class UploadDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: IStorageService,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(DocumentSeries)
    private readonly documentSeriesRepo: Repository<DocumentSeries>,
    @InjectRepository(Dossie)
    private readonly dossieRepo: Repository<Dossie>,
  ) {}

  async execute(data: UploadDocumentData, file: Express.Multer.File): Promise<Document> {
    const departamento = await this.departmentRepo.findOne({
      where: { id: data.departamentoId },
    });
    if (!departamento) {
      throw new BadRequestException('Departamento não encontrado');
    }

    const serie = await this.documentSeriesRepo.findOne({ where: { id: data.serieId } });
    if (!serie) {
      throw new BadRequestException('Série não encontrada');
    }
    if (serie.departamentoId !== data.departamentoId) {
      throw new BadRequestException(
        'A série deve pertencer ao mesmo departamento do documento',
      );
    }

    if (data.dossieId) {
      const dossie = await this.dossieRepo.findOne({ where: { id: data.dossieId } });
      if (!dossie) {
        throw new BadRequestException('Dossiê não encontrado');
      }
      if (dossie.departamentoId !== data.departamentoId) {
        throw new BadRequestException(
          'O dossiê deve pertencer ao mesmo departamento do documento',
        );
      }
    }

    const saved = await this.storageService.save({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
    });

    try {
      return await this.documentRepository.create({
        nome: data.nome,
        descricao: data.descricao ?? null,
        validade: data.validade ? new Date(data.validade) : null,
        confidencialidade: data.confidencialidade ?? CONFIDENCIALIDADE.RESTRITO,
        departamentoId: data.departamentoId,
        serieId: data.serieId,
        dossieId: data.dossieId ?? null,
        fase: DOCUMENT_FASE.CORRENTE,
        faseCorrenteDesde: new Date(),
        arquivoNome: file.originalname,
        arquivoChave: saved.chave,
        arquivoMimeType: file.mimetype,
        arquivoTamanho: saved.tamanho,
        destaque: data.destaque ?? false,
        exigeCadastro: data.exigeCadastro ?? false,
      });
    } catch (error) {
      await this.storageService.delete(saved.chave);
      throw error;
    }
  }
}
