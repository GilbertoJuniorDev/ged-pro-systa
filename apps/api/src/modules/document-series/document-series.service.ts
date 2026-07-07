import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department, type DocumentSeries } from '@ged/database';
import type {
  IDocumentSeriesRepository,
  CreateDocumentSeriesData,
  UpdateDocumentSeriesData,
} from './interfaces/document-series-repository.interface';

export const DOCUMENT_SERIES_REPOSITORY = 'DOCUMENT_SERIES_REPOSITORY';

const MAX_ANCESTOR_WALK = 100;

@Injectable()
export class DocumentSeriesService {
  constructor(
    @Inject(DOCUMENT_SERIES_REPOSITORY)
    private readonly documentSeriesRepository: IDocumentSeriesRepository,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) {}

  findAll(departamentoId?: string): Promise<DocumentSeries[]> {
    return this.documentSeriesRepository.findAll({ departamentoId });
  }

  async findOne(id: string): Promise<DocumentSeries> {
    const documentSeries = await this.documentSeriesRepository.findById(id);
    if (!documentSeries) {
      throw new NotFoundException('Série de documento não encontrada');
    }
    return documentSeries;
  }

  async create(data: CreateDocumentSeriesData): Promise<DocumentSeries> {
    const departamento = await this.departmentRepo.findOne({
      where: { id: data.departamentoId },
    });
    if (!departamento) {
      throw new BadRequestException('Departamento não encontrado');
    }

    const existing = await this.documentSeriesRepository.findByDepartamentoAndCodigo(
      data.departamentoId,
      data.codigo,
    );
    if (existing) {
      throw new ConflictException(
        'Já existe uma série com este código neste departamento',
      );
    }

    if (data.seriePaiId) {
      const seriePai = await this.documentSeriesRepository.findById(data.seriePaiId);
      if (!seriePai) {
        throw new BadRequestException('Série pai não encontrada');
      }
      if (seriePai.departamentoId !== data.departamentoId) {
        throw new BadRequestException(
          'A série pai deve pertencer ao mesmo departamento',
        );
      }
    }

    return this.documentSeriesRepository.create(data);
  }

  async update(id: string, data: UpdateDocumentSeriesData): Promise<DocumentSeries> {
    const current = await this.findOne(id);

    if (data.codigo && data.codigo !== current.codigo) {
      const existing = await this.documentSeriesRepository.findByDepartamentoAndCodigo(
        current.departamentoId,
        data.codigo,
      );
      if (existing && existing.id !== id) {
        throw new ConflictException(
          'Já existe uma série com este código neste departamento',
        );
      }
    }

    if (data.seriePaiId) {
      if (data.seriePaiId === id) {
        throw new BadRequestException('Uma série não pode ser pai de si mesma');
      }

      const seriePai = await this.documentSeriesRepository.findById(data.seriePaiId);
      if (!seriePai) {
        throw new BadRequestException('Série pai não encontrada');
      }
      if (seriePai.departamentoId !== current.departamentoId) {
        throw new BadRequestException(
          'A série pai deve pertencer ao mesmo departamento',
        );
      }

      let ancestorId = seriePai.seriePaiId;
      let iterations = 0;
      while (ancestorId) {
        if (iterations >= MAX_ANCESTOR_WALK) {
          throw new Error(
            'Limite de profundidade excedido ao verificar hierarquia de séries',
          );
        }
        if (ancestorId === id) {
          throw new BadRequestException(
            'Referência circular na hierarquia de séries',
          );
        }
        const ancestor = await this.documentSeriesRepository.findById(ancestorId);
        ancestorId = ancestor?.seriePaiId ?? null;
        iterations += 1;
      }
    }

    return this.documentSeriesRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    try {
      await this.documentSeriesRepository.delete(id);
    } catch (error) {
      if ((error as { code?: string }).code === '23503') {
        throw new ConflictException(
          'Não é possível remover: existem documentos ou séries vinculados a esta série',
        );
      }
      throw error;
    }
  }
}
