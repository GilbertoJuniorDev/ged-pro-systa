import type {
  DashboardConfidencialidadeCounts,
  DashboardDestinacaoFinalCounts,
  DashboardDocumentosPorMes,
  DashboardFaseCounts,
  DashboardSummaryDto,
} from '@ged/types';

export class DashboardSummaryResponseDto implements DashboardSummaryDto {
  readonly totalDocumentos!: number;
  readonly documentosPorFase!: DashboardFaseCounts;
  readonly documentosPorConfidencialidade!: DashboardConfidencialidadeCounts;
  readonly documentosPorDestinacaoFinal!: DashboardDestinacaoFinalCounts;
  readonly documentosElegiveisTransferencia!: number;
  readonly armazenamentoTotalBytes!: number;
  readonly documentosCriadosPorMes!: readonly DashboardDocumentosPorMes[];

  constructor(partial: DashboardSummaryDto) {
    Object.assign(this, partial);
  }
}
