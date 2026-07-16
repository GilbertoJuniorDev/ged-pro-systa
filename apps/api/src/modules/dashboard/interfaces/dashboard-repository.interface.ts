import type { AccessScope } from '../../documents/access-scope';

export const DASHBOARD_REPOSITORY = 'DASHBOARD_REPOSITORY';

export interface DashboardFaseCounts {
  readonly corrente: number;
  readonly intermediario: number;
}

export interface DashboardConfidencialidadeCounts {
  readonly publico: number;
  readonly restrito: number;
  readonly confidencial: number;
}

export interface DashboardDestinacaoFinalCounts {
  readonly guardaPermanente: number;
  readonly eliminacao: number;
}

export interface DashboardDocumentosPorMesRow {
  readonly mes: string;
  readonly total: number;
}

export interface DashboardDepartamentoCountRow {
  readonly departamentoId: string;
  readonly departamentoNome: string;
  readonly totalDocumentos: number;
}

// `scope: null` = papel privilegiado (SUPER_ADMIN/ADMIN), sem restrição por departamento.
// Ver `resolveAccessScope` em `../documents/access-scope.ts` para como o escopo é resolvido.
export interface IDashboardRepository {
  countTotal(scope: AccessScope | null): Promise<number>;
  countByFase(scope: AccessScope | null): Promise<DashboardFaseCounts>;
  countByConfidencialidade(scope: AccessScope | null): Promise<DashboardConfidencialidadeCounts>;
  countByDestinacaoFinal(scope: AccessScope | null): Promise<DashboardDestinacaoFinalCounts>;
  countElegiveisTransferencia(scope: AccessScope | null): Promise<number>;
  sumArmazenamentoBytes(scope: AccessScope | null): Promise<number>;
  countCriadosPorMes(
    scope: AccessScope | null,
    since: Date,
  ): Promise<DashboardDocumentosPorMesRow[]>;
  // Sempre sem escopo — a rota que consome este método já é ADMIN/SUPER_ADMIN-only.
  countPorDepartamento(): Promise<DashboardDepartamentoCountRow[]>;
  countUsuariosAtivos(): Promise<number>;
  countDepartamentos(): Promise<number>;
}
