import { Test, type TestingModule } from '@nestjs/testing';
import { ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary-response.dto';
import { DashboardAdminSummaryResponseDto } from './dto/dashboard-admin-summary-response.dto';

const makeJwtPayload = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  sub: 'user-1',
  email: 'user@ged.local',
  role: ROLE.ADMIN,
  ...overrides,
});

const makeSummaryDto = (): DashboardSummaryResponseDto =>
  new DashboardSummaryResponseDto({
    totalDocumentos: 10,
    documentosPorFase: { corrente: 7, intermediario: 3 },
    documentosPorConfidencialidade: { publico: 5, restrito: 4, confidencial: 1 },
    documentosPorDestinacaoFinal: { guardaPermanente: 6, eliminacao: 4 },
    documentosElegiveisTransferencia: 2,
    armazenamentoTotalBytes: 2048,
    documentosCriadosPorMes: [{ mes: '2026-07', total: 4 }],
  });

const makeAdminSummaryDto = (): DashboardAdminSummaryResponseDto =>
  new DashboardAdminSummaryResponseDto({
    documentosPorDepartamento: [
      { departamentoId: 'dept-1', departamentoNome: 'Financeiro', totalDocumentos: 12 },
    ],
    totalUsuariosAtivos: 8,
    totalDepartamentos: 3,
  });

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: jest.Mocked<Pick<DashboardService, 'getSummary' | 'getAdminSummary'>>;

  beforeEach(async () => {
    dashboardService = {
      getSummary: jest.fn(),
      getAdminSummary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: dashboardService }],
    }).compile();

    controller = module.get(DashboardController);
  });

  describe('summary', () => {
    it("returns the scoped summary for the current user", async () => {
      const dto = makeSummaryDto();
      dashboardService.getSummary.mockResolvedValue(dto);
      const user = makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER });

      const result = await controller.summary(user);

      expect(dashboardService.getSummary).toHaveBeenCalledWith(user);
      expect(result).toEqual(dto);
    });
  });

  describe('adminSummary', () => {
    it('returns the admin-only summary', async () => {
      const dto = makeAdminSummaryDto();
      dashboardService.getAdminSummary.mockResolvedValue(dto);

      const result = await controller.adminSummary();

      expect(dashboardService.getAdminSummary).toHaveBeenCalledWith();
      expect(result).toEqual(dto);
    });
  });
});
