import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Arquivo, ArquivoDepartment, Dossie } from '@ged/database';
import type {
  IArquivoRepository,
  ArquivoQueryFilter,
  PaginatedArquivos,
  UpdateArquivoData,
} from './interfaces/arquivo-repository.interface';

@Injectable()
export class ArquivosRepository implements IArquivoRepository {
  constructor(
    @InjectRepository(Arquivo)
    private readonly repo: Repository<Arquivo>,
    @InjectRepository(ArquivoDepartment)
    private readonly arquivoDepartmentRepo: Repository<ArquivoDepartment>,
    @InjectRepository(Dossie)
    private readonly dossieRepo: Repository<Dossie>,
  ) {}

  async findAll(filter: ArquivoQueryFilter): Promise<PaginatedArquivos> {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('arquivo')
      .orderBy('arquivo.createdAt', 'DESC')
      .addOrderBy('arquivo.id', 'DESC')
      .skip(skip)
      .take(limit);

    if (filter.departamentoId) {
      qb.andWhere(
        `(arquivo.departamento_id = :departamentoId
          OR EXISTS (
            SELECT 1 FROM arquivo_departments ad
            WHERE ad.arquivo_id = arquivo.id AND ad.departamento_id = :departamentoId
          ))`,
        { departamentoId: filter.departamentoId },
      );
    }
    if (filter.status) {
      qb.andWhere('arquivo.status = :status', { status: filter.status });
    }
    if (filter.ano) {
      qb.andWhere('arquivo.ano = :ano', { ano: filter.ano });
    }
    if (filter.search) {
      qb.andWhere('(arquivo.nome ILIKE :search OR arquivo.codigo ILIKE :search)', {
        search: `%${filter.search}%`,
      });
    }
    if (filter.allowedDepartamentoIds) {
      qb.andWhere(
        `(arquivo.departamento_id = ANY(:allowedDepartamentoIds)
          OR EXISTS (
            SELECT 1 FROM arquivo_departments ad
            WHERE ad.arquivo_id = arquivo.id AND ad.departamento_id = ANY(:allowedDepartamentoIds)
          ))`,
        { allowedDepartamentoIds: [...filter.allowedDepartamentoIds] },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  findById(id: string): Promise<Arquivo | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, data: UpdateArquivoData): Promise<Arquivo> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findDepartamentoIds(arquivoId: string): Promise<string[]> {
    const rows = await this.arquivoDepartmentRepo.find({ where: { arquivoId } });
    return rows.map((row) => row.departamentoId);
  }

  async findDepartamentoIdsByArquivos(
    arquivoIds: readonly string[],
  ): Promise<Map<string, string[]>> {
    if (arquivoIds.length === 0) {
      return new Map();
    }
    const rows = await this.arquivoDepartmentRepo.find({
      where: { arquivoId: In([...arquivoIds]) },
    });
    const map = new Map<string, string[]>();
    for (const row of rows) {
      const list = map.get(row.arquivoId);
      if (list) {
        list.push(row.departamentoId);
      } else {
        map.set(row.arquivoId, [row.departamentoId]);
      }
    }
    return map;
  }

  async countDossiesByArquivo(arquivoIds: readonly string[]): Promise<Map<string, number>> {
    if (arquivoIds.length === 0) {
      return new Map();
    }
    const rows = await this.dossieRepo
      .createQueryBuilder('dossie')
      .select('dossie.arquivo_id', 'arquivoId')
      .addSelect('COUNT(*)', 'count')
      .where('dossie.arquivo_id = ANY(:arquivoIds)', { arquivoIds: [...arquivoIds] })
      .groupBy('dossie.arquivo_id')
      .getRawMany<{ arquivoId: string; count: string }>();
    return new Map(rows.map((row) => [row.arquivoId, Number(row.count)]));
  }

  async syncDepartamentos(arquivoId: string, departamentoIds: readonly string[]): Promise<void> {
    await this.arquivoDepartmentRepo.manager.transaction(async (manager) => {
      await manager.delete(ArquivoDepartment, { arquivoId });
      if (departamentoIds.length === 0) return;
      const rows = departamentoIds.map((departamentoId) =>
        manager.create(ArquivoDepartment, { arquivoId, departamentoId }),
      );
      await manager.save(ArquivoDepartment, rows);
    });
  }
}
