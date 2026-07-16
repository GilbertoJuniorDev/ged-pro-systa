import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, SelectQueryBuilder } from 'typeorm';
import {
  CONFIDENCIALIDADE,
  Department,
  DESTINACAO_FINAL,
  Document,
  DOCUMENT_FASE,
  User,
} from '@ged/database';
import type { Confidencialidade, DestinacaoFinal, DocumentFase } from '@ged/database';
import { accessScopeSqlFragment } from '../documents/access-scope';
import type { AccessScope } from '../documents/access-scope';
import type {
  DashboardConfidencialidadeCounts,
  DashboardDepartamentoCountRow,
  DashboardDestinacaoFinalCounts,
  DashboardDocumentosPorMesRow,
  DashboardFaseCounts,
  IDashboardRepository,
} from './interfaces/dashboard-repository.interface';

interface FaseCountRow {
  readonly fase: DocumentFase;
  readonly total: string;
}

interface ConfidencialidadeCountRow {
  readonly confidencialidade: Confidencialidade;
  readonly total: string;
}

interface DestinacaoFinalCountRow {
  readonly destinacaoFinal: DestinacaoFinal;
  readonly total: string;
}

interface CriadosPorMesRow {
  readonly mes: string;
  readonly total: string;
}

interface PorDepartamentoRow {
  readonly departamentoId: string;
  readonly departamentoNome: string;
  readonly totalDocumentos: string;
}

@Injectable()
export class DashboardRepository implements IDashboardRepository {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // Aplica o mesmo fragmento de escopo usado por DocumentsRepository.findAll (ver
  // `../documents/access-scope.ts`). `scope: null` (papel privilegiado) não filtra nada.
  private applyAccessScope<T extends object>(
    qb: SelectQueryBuilder<T>,
    documentAlias: string,
    scope: AccessScope | null,
  ): void {
    if (scope === null) {
      return;
    }
    qb.andWhere(accessScopeSqlFragment(documentAlias), {
      userDepartamentoIds: scope.userDepartamentoIds,
      userId: scope.userId,
    });
  }

  async countTotal(scope: AccessScope | null): Promise<number> {
    const qb = this.documentRepo.createQueryBuilder('document');
    this.applyAccessScope(qb, 'document', scope);
    return qb.getCount();
  }

  async countByFase(scope: AccessScope | null): Promise<DashboardFaseCounts> {
    const qb = this.documentRepo
      .createQueryBuilder('document')
      .select('document.fase', 'fase')
      .addSelect('COUNT(*)', 'total')
      .groupBy('document.fase');
    this.applyAccessScope(qb, 'document', scope);

    const rows = await qb.getRawMany<FaseCountRow>();
    const totals: Record<DocumentFase, number> = {
      [DOCUMENT_FASE.CORRENTE]: 0,
      [DOCUMENT_FASE.INTERMEDIARIO]: 0,
    };
    for (const row of rows) {
      totals[row.fase] = Number(row.total);
    }
    return {
      corrente: totals[DOCUMENT_FASE.CORRENTE],
      intermediario: totals[DOCUMENT_FASE.INTERMEDIARIO],
    };
  }

  async countByConfidencialidade(
    scope: AccessScope | null,
  ): Promise<DashboardConfidencialidadeCounts> {
    const qb = this.documentRepo
      .createQueryBuilder('document')
      .select('document.confidencialidade', 'confidencialidade')
      .addSelect('COUNT(*)', 'total')
      .groupBy('document.confidencialidade');
    this.applyAccessScope(qb, 'document', scope);

    const rows = await qb.getRawMany<ConfidencialidadeCountRow>();
    const totals: Record<Confidencialidade, number> = {
      [CONFIDENCIALIDADE.PUBLICO]: 0,
      [CONFIDENCIALIDADE.RESTRITO]: 0,
      [CONFIDENCIALIDADE.CONFIDENCIAL]: 0,
    };
    for (const row of rows) {
      totals[row.confidencialidade] = Number(row.total);
    }
    return {
      publico: totals[CONFIDENCIALIDADE.PUBLICO],
      restrito: totals[CONFIDENCIALIDADE.RESTRITO],
      confidencial: totals[CONFIDENCIALIDADE.CONFIDENCIAL],
    };
  }

  async countByDestinacaoFinal(
    scope: AccessScope | null,
  ): Promise<DashboardDestinacaoFinalCounts> {
    const qb = this.documentRepo
      .createQueryBuilder('document')
      .innerJoin('document.serie', 'serie')
      .select('serie.destinacaoFinal', 'destinacaoFinal')
      .addSelect('COUNT(*)', 'total')
      .groupBy('serie.destinacaoFinal');
    this.applyAccessScope(qb, 'document', scope);

    const rows = await qb.getRawMany<DestinacaoFinalCountRow>();
    const totals: Record<DestinacaoFinal, number> = {
      [DESTINACAO_FINAL.GUARDA_PERMANENTE]: 0,
      [DESTINACAO_FINAL.ELIMINACAO]: 0,
    };
    for (const row of rows) {
      totals[row.destinacaoFinal] = Number(row.total);
    }
    return {
      guardaPermanente: totals[DESTINACAO_FINAL.GUARDA_PERMANENTE],
      eliminacao: totals[DESTINACAO_FINAL.ELIMINACAO],
    };
  }

  async countElegiveisTransferencia(scope: AccessScope | null): Promise<number> {
    const qb = this.documentRepo
      .createQueryBuilder('document')
      .innerJoin('document.serie', 'serie')
      .where('document.fase = :fase', { fase: DOCUMENT_FASE.CORRENTE })
      .andWhere(
        "document.fase_corrente_desde + (serie.prazo_corrente_meses || ' months')::interval <= NOW()",
      );
    this.applyAccessScope(qb, 'document', scope);
    return qb.getCount();
  }

  async sumArmazenamentoBytes(scope: AccessScope | null): Promise<number> {
    const qb = this.documentRepo
      .createQueryBuilder('document')
      .select('COALESCE(SUM(document.arquivo_tamanho), 0)', 'total');
    this.applyAccessScope(qb, 'document', scope);

    const row = await qb.getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  async countCriadosPorMes(
    scope: AccessScope | null,
    since: Date,
  ): Promise<DashboardDocumentosPorMesRow[]> {
    const qb = this.documentRepo
      .createQueryBuilder('document')
      .select("to_char(date_trunc('month', document.created_at), 'YYYY-MM')", 'mes')
      .addSelect('COUNT(*)', 'total')
      .where('document.created_at >= :since', { since })
      .groupBy('1')
      .orderBy('1', 'ASC');
    this.applyAccessScope(qb, 'document', scope);

    const rows = await qb.getRawMany<CriadosPorMesRow>();
    return rows.map((row) => ({ mes: row.mes, total: Number(row.total) }));
  }

  async countPorDepartamento(): Promise<DashboardDepartamentoCountRow[]> {
    const rows = await this.documentRepo
      .createQueryBuilder('document')
      .innerJoin('document.departamento', 'department')
      .select('department.id', 'departamentoId')
      .addSelect('department.nome', 'departamentoNome')
      .addSelect('COUNT(document.id)', 'totalDocumentos')
      .groupBy('department.id')
      .addGroupBy('department.nome')
      .getRawMany<PorDepartamentoRow>();

    return rows.map((row) => ({
      departamentoId: row.departamentoId,
      departamentoNome: row.departamentoNome,
      totalDocumentos: Number(row.totalDocumentos),
    }));
  }

  countUsuariosAtivos(): Promise<number> {
    return this.userRepo.count({ where: { isActive: true } });
  }

  countDepartamentos(): Promise<number> {
    return this.departmentRepo.count();
  }
}
