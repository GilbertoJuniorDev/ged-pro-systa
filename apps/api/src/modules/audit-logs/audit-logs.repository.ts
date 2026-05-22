import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@ged/database';
import type { CreateAuditLogData } from './dto/create-audit-log.dto';

export interface AuditLogFilter {
  readonly usuarioId?: string;
  readonly acao?: string;
  readonly entidade?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface PaginatedAuditLogs {
  readonly data: AuditLog[];
  readonly total: number;
}

@Injectable()
export class AuditLogsRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async create(data: CreateAuditLogData): Promise<AuditLog> {
    const log = this.repo.create(data);
    return this.repo.save(log);
  }

  async findAll(filter: AuditLogFilter): Promise<PaginatedAuditLogs> {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('al')
      .orderBy('al.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (filter.usuarioId) {
      qb.andWhere('al.usuario_id = :usuarioId', { usuarioId: filter.usuarioId });
    }
    if (filter.acao) {
      qb.andWhere('al.acao ILIKE :acao', { acao: `%${filter.acao}%` });
    }
    if (filter.entidade) {
      qb.andWhere('al.entidade = :entidade', { entidade: filter.entidade });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  hasLogsByUser(userId: string): Promise<boolean> {
    return this.repo.existsBy({ usuarioId: userId });
  }
}
