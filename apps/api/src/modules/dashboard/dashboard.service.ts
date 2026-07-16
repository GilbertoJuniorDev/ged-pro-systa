import { Inject, Injectable } from '@nestjs/common';
import type { DashboardDocumentosPorMes } from '@ged/types';
import type { JwtPayload } from '@ged/types';
import { UserDepartmentsService } from '../user-departments/user-departments.service';
import { resolveAccessScope } from '../documents/access-scope';
import { DASHBOARD_REPOSITORY } from './interfaces/dashboard-repository.interface';
import type {
  DashboardDocumentosPorMesRow,
  IDashboardRepository,
} from './interfaces/dashboard-repository.interface';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary-response.dto';
import { DashboardAdminSummaryResponseDto } from './dto/dashboard-admin-summary-response.dto';

// Janela do gráfico "documentos criados por mês" no summary: mês atual + 5 anteriores.
const MESES_HISTORICO = 6;

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: IDashboardRepository,
    private readonly userDepartmentsService: UserDepartmentsService,
  ) {}

  async getSummary(user: JwtPayload): Promise<DashboardSummaryResponseDto> {
    const scope = await resolveAccessScope(user, this.userDepartmentsService);
    const since = this.firstDayOfMonthsAgo(MESES_HISTORICO - 1);

    const [
      totalDocumentos,
      documentosPorFase,
      documentosPorConfidencialidade,
      documentosPorDestinacaoFinal,
      documentosElegiveisTransferencia,
      armazenamentoTotalBytes,
      criadosPorMes,
    ] = await Promise.all([
      this.dashboardRepository.countTotal(scope),
      this.dashboardRepository.countByFase(scope),
      this.dashboardRepository.countByConfidencialidade(scope),
      this.dashboardRepository.countByDestinacaoFinal(scope),
      this.dashboardRepository.countElegiveisTransferencia(scope),
      this.dashboardRepository.sumArmazenamentoBytes(scope),
      this.dashboardRepository.countCriadosPorMes(scope, since),
    ]);

    return new DashboardSummaryResponseDto({
      totalDocumentos,
      documentosPorFase,
      documentosPorConfidencialidade,
      documentosPorDestinacaoFinal,
      documentosElegiveisTransferencia,
      armazenamentoTotalBytes,
      documentosCriadosPorMes: this.fillMesesComZeros(criadosPorMes),
    });
  }

  async getAdminSummary(): Promise<DashboardAdminSummaryResponseDto> {
    const [documentosPorDepartamento, totalUsuariosAtivos, totalDepartamentos] =
      await Promise.all([
        this.dashboardRepository.countPorDepartamento(),
        this.dashboardRepository.countUsuariosAtivos(),
        this.dashboardRepository.countDepartamentos(),
      ]);

    return new DashboardAdminSummaryResponseDto({
      documentosPorDepartamento,
      totalUsuariosAtivos,
      totalDepartamentos,
    });
  }

  // O repositório só retorna meses com pelo menos um documento criado (GROUP BY não
  // produz linha para contagem zero). Aqui construímos a lista completa das últimas
  // MESES_HISTORICO chaves 'YYYY-MM' (incluindo o mês atual) e mesclamos com o
  // resultado esparso, preenchendo os meses ausentes com total: 0.
  private fillMesesComZeros(
    rows: readonly DashboardDocumentosPorMesRow[],
  ): DashboardDocumentosPorMes[] {
    const totalPorMes = new Map(rows.map((row) => [row.mes, row.total]));
    return this.lastMonthKeys(MESES_HISTORICO).map((mes) => ({
      mes,
      total: totalPorMes.get(mes) ?? 0,
    }));
  }

  private lastMonthKeys(count: number): string[] {
    const now = new Date();
    const keys: string[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      keys.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`);
    }
    return keys;
  }

  private firstDayOfMonthsAgo(months: number): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 1));
  }
}
