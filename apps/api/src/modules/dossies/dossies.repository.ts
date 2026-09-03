import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, Dossie } from '@ged/database';
import { accessScopeSqlFragment } from '../documents/access-scope';
import type {
  IDossieRepository,
  DossieQueryFilter,
  PaginatedDossies,
  CreateDossieData,
  UpdateDossieData,
} from './interfaces/dossie-repository.interface';

@Injectable()
export class DossiesRepository implements IDossieRepository {
  constructor(
    @InjectRepository(Dossie)
    private readonly repo: Repository<Dossie>,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
  ) {}

  async findAll(filter: DossieQueryFilter): Promise<PaginatedDossies> {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('dossie')
      .orderBy('dossie.nome', 'ASC')
      .addOrderBy('dossie.id', 'ASC')
      .skip(skip)
      .take(limit);

    if (filter.departamentoId) {
      qb.andWhere('dossie.departamento_id = :departamentoId', {
        departamentoId: filter.departamentoId,
      });
    } else if (filter.allowedDepartamentoIds) {
      qb.andWhere('dossie.departamento_id = ANY(:allowedDepartamentoIds)', {
        allowedDepartamentoIds: [...filter.allowedDepartamentoIds],
      });
    }
    if (filter.arquivoId !== undefined) {
      qb.andWhere('dossie.arquivo_id = :arquivoId', { arquivoId: filter.arquivoId });
    }
    if (filter.semArquivo) {
      qb.andWhere('dossie.arquivo_id IS NULL');
    }
    if (filter.search) {
      qb.andWhere('(dossie.nome ILIKE :search OR dossie.descricao ILIKE :search)', {
        search: `%${filter.search}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  findById(id: string): Promise<Dossie | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: CreateDossieData): Promise<Dossie> {
    const dossie = this.repo.create(data);
    return this.repo.save(dossie);
  }

  async update(id: string, data: UpdateDossieData): Promise<Dossie> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async countDocumentsByDossie(
    dossieIds: readonly string[],
    accessScope: { readonly userId: string; readonly userDepartamentoIds: readonly string[] } | null,
  ): Promise<Map<string, number>> {
    if (dossieIds.length === 0) {
      return new Map();
    }
    const qb = this.documentRepo
      .createQueryBuilder('document')
      .select('document.dossie_id', 'dossieId')
      .addSelect('COUNT(*)', 'count')
      .where('document.dossie_id = ANY(:dossieIds)', { dossieIds: [...dossieIds] })
      .groupBy('document.dossie_id');

    if (accessScope) {
      const { userId, userDepartamentoIds } = accessScope;
      qb.andWhere(accessScopeSqlFragment('document'), { userDepartamentoIds, userId });
    }

    const rows = await qb.getRawMany<{ dossieId: string; count: string }>();
    return new Map(rows.map((row) => [row.dossieId, Number(row.count)]));
  }
}
