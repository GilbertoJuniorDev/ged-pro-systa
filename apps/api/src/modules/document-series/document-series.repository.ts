import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentSeries } from '@ged/database';
import type {
  IDocumentSeriesRepository,
  CreateDocumentSeriesData,
  UpdateDocumentSeriesData,
} from './interfaces/document-series-repository.interface';

@Injectable()
export class DocumentSeriesRepository implements IDocumentSeriesRepository {
  constructor(
    @InjectRepository(DocumentSeries)
    private readonly repo: Repository<DocumentSeries>,
  ) {}

  findAll(filter?: { departamentoId?: string }): Promise<DocumentSeries[]> {
    return this.repo.find({
      where: filter?.departamentoId ? { departamentoId: filter.departamentoId } : {},
      order: { codigo: 'ASC' },
    });
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
