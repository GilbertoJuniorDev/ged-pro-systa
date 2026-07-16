import type { DashboardAdminSummaryDto, DashboardDepartamentoCount } from '@ged/types';

export class DashboardAdminSummaryResponseDto implements DashboardAdminSummaryDto {
  readonly documentosPorDepartamento!: readonly DashboardDepartamentoCount[];
  readonly totalUsuariosAtivos!: number;
  readonly totalDepartamentos!: number;

  constructor(partial: DashboardAdminSummaryDto) {
    Object.assign(this, partial);
  }
}
