import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, type FindOptionsWhere } from 'typeorm';
import { DocumentSeries } from '@ged/database';
import type {
  IDocumentSeriesRepository,
  DocumentSeriesQueryFilter,
  CreateDocumentSeriesData,
  UpdateDocumentSeriesData,
} from './interfaces/document-series-repository.interface';

@Injectable()
export class DocumentSeriesRepository implements IDocumentSeriesRepository {
  constructor(
    @InjectRepository(DocumentSeries)
    private readonly repo: Repository<DocumentSeries>,
  ) {}

  findAll(filter?: DocumentSeriesQueryFilter): Promise<DocumentSeries[]> {
    const where: FindOptionsWhere<DocumentSeries> = {};
    if (filter?.departamentoId) {
      where.departamentoId = filter.departamentoId;
    } else if (filter?.allowedDepartamentoIds) {
      where.departamentoId = In([...filter.allowedDepartamentoIds]);
    }
    return this.repo.find({ where, order: { codigo: 'ASC' } });
  }

  findById(id: string): Promise<DocumentSeries | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByDepartamentoAndCodigo(
    departamentoId: string,
    codigo: string,
  ): Promise<DocumentSeries | null> {
    return this.repo.findOne({ where: { departamentoId, codigo } });
  }

  async create(data: CreateDocumentSeriesData): Promise<DocumentSeries> {
    const documentSeries = this.repo.create(data);
    return this.repo.save(documentSeries);
  }

  async update(id: string, data: UpdateDocumentSeriesData): Promise<DocumentSeries> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
