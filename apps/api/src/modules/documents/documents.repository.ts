import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '@ged/database';
import type {
  IDocumentRepository,
  CreateDocumentData,
  UpdateDocumentData,
  DocumentQueryFilter,
  PaginatedDocuments,
} from './interfaces/document-repository.interface';

@Injectable()
export class DocumentsRepository implements IDocumentRepository {
  constructor(
    @InjectRepository(Document)
    private readonly repo: Repository<Document>,
  ) {}

  async findAll(filter: DocumentQueryFilter): Promise<PaginatedDocuments> {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.serie', 'serie')
      .orderBy('document.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (filter.departamentoId) {
      qb.andWhere('document.departamento_id = :departamentoId', {
        departamentoId: filter.departamentoId,
      });
    }
    if (filter.dossieId) {
      qb.andWhere('document.dossie_id = :dossieId', { dossieId: filter.dossieId });
    }
    if (filter.serieId) {
      qb.andWhere('document.serie_id = :serieId', { serieId: filter.serieId });
    }
    if (filter.fase) {
      qb.andWhere('document.fase = :fase', { fase: filter.fase });
    }
    if (filter.confidencialidade) {
      qb.andWhere('document.confidencialidade = :confidencialidade', {
        confidencialidade: filter.confidencialidade,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  findById(id: string): Promise<Document | null> {
    return this.repo.findOne({ where: { id }, relations: ['serie'] });
  }

  async create(data: CreateDocumentData): Promise<Document> {
    const document = this.repo.create(data);
    return this.repo.save(document);
  }

  async update(id: string, data: UpdateDocumentData): Promise<Document> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id }, relations: ['serie'] });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
