import { Test, type TestingModule } from '@nestjs/testing';
import { ROLE } from '@ged/database';
import type { UserDepartment } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { UserDepartmentsService } from '../user-departments/user-departments.service';
import { DashboardService } from './dashboard.service';
import { DASHBOARD_REPOSITORY } from './interfaces/dashboard-repository.interface';
import type { IDashboardRepository } from './interfaces/dashboard-repository.interface';

const makeJwtPayload = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  sub: 'user-1',
  email: 'user@ged.local',
  role: ROLE.ADMIN,
  ...overrides,
});

const makeUserDepartment = (departamentoId: string): UserDepartment =>
  ({ departamentoId }) as UserDepartment;

describe('DashboardService', () => {
  let service: DashboardService;
  let dashboardRepository: jest.Mocked<IDashboardRepository>;
  let userDepartmentsService: jest.Mocked<Pick<UserDepartmentsService, 'findByUserId'>>;

  const stubAllCounts = () => {
    dashboardRepository.countTotal.mockResolvedValue(10);
    dashboardRepository.countByFase.mockResolvedValue({ corrente: 7, intermediario: 3 });
    dashboardRepository.countByConfidencialidade.mockResolvedValue({
      publico: 5,
      restrito: 4,
      confidencial: 1,
    });
    dashboardRepository.countByDestinacaoFinal.mockResolvedValue({
      guardaPermanente: 6,
      eliminacao: 4,
    });
    dashboardRepository.countElegiveisTransferencia.mockResolvedValue(2);
    dashboardRepository.sumArmazenamentoBytes.mockResolvedValue(2048);
    dashboardRepository.countCriadosPorMes.mockResolvedValue([]);
  };

  beforeEach(async () => {
    dashboardRepository = {
      countTotal: jest.fn(),
      countByFase: jest.fn(),
      countByConfidencialidade: jest.fn(),
      countByDestinacaoFinal: jest.fn(),
      countElegiveisTransferencia: jest.fn(),
      sumArmazenamentoBytes: jest.fn(),
      countCriadosPorMes: jest.fn(),
      countPorDepartamento: jest.fn(),
      countUsuariosAtivos: jest.fn(),
      countDepartamentos: jest.fn(),
    };
    userDepartmentsService = { findByUserId: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: DASHBOARD_REPOSITORY, useValue: dashboardRepository },
        { provide: UserDepartmentsService, useValue: userDepartmentsService },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  describe('getSummary', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('resolves scope to null and calls every repository method unscoped for a privileged (ADMIN) user', async () => {
      stubAllCounts();

      await service.getSummary(makeJwtPayload({ role: ROLE.ADMIN }));

      expect(userDepartmentsService.findByUserId).not.toHaveBeenCalled();
      expect(dashboardRepository.countTotal).toHaveBeenCalledWith(null);
      expect(dashboardRepository.countByFase).toHaveBeenCalledWith(null);
      expect(dashboardRepository.countByConfidencialidade).toHaveBeenCalledWith(null);
      expect(dashboardRepository.countByDestinacaoFinal).toHaveBeenCalledWith(null);
      expect(dashboardRepository.countElegiveisTransferencia).toHaveBeenCalledWith(null);
      expect(dashboardRepository.sumArmazenamentoBytes).toHaveBeenCalledWith(null);
      expect(dashboardRepository.countCriadosPorMes).toHaveBeenCalledWith(null, expect.any(Date));
    });

    it('resolves scope to null for a SUPER_ADMIN user as well', async () => {
      stubAllCounts();

      await service.getSummary(makeJwtPayload({ role: ROLE.SUPER_ADMIN }));

      expect(userDepartmentsService.findByUserId).not.toHaveBeenCalled();
      expect(dashboardRepository.countTotal).toHaveBeenCalledWith(null);
    });

    it("resolves a non-privileged (VIEWER) user's departamentos and calls repository methods with that scope", async () => {
      stubAllCounts();
      userDepartmentsService.findByUserId.mockResolvedValue([
        makeUserDepartment('dept-1'),
        makeUserDepartment('dept-2'),
      ]);

      await service.getSummary(makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER }));

      const expectedScope = { userId: 'viewer-1', userDepartamentoIds: ['dept-1', 'dept-2'] };
      expect(userDepartmentsService.findByUserId).toHaveBeenCalledWith('viewer-1');
      expect(dashboardRepository.countTotal).toHaveBeenCalledWith(expectedScope);
      expect(dashboardRepository.countByFase).toHaveBeenCalledWith(expectedScope);
      expect(dashboardRepository.countByConfidencialidade).toHaveBeenCalledWith(expectedScope);
      expect(dashboardRepository.countByDestinacaoFinal).toHaveBeenCalledWith(expectedScope);
      expect(dashboardRepository.countElegiveisTransferencia).toHaveBeenCalledWith(expectedScope);
      expect(dashboardRepository.sumArmazenamentoBytes).toHaveBeenCalledWith(expectedScope);
      expect(dashboardRepository.countCriadosPorMes).toHaveBeenCalledWith(
        expectedScope,
        expect.any(Date),
      );
    });

    it('maps the repository counts into the summary DTO fields verbatim', async () => {
      stubAllCounts();

      const result = await service.getSummary(makeJwtPayload({ role: ROLE.ADMIN }));

      expect(result.totalDocumentos).toBe(10);
      expect(result.documentosPorFase).toEqual({ corrente: 7, intermediario: 3 });
      expect(result.documentosPorConfidencialidade).toEqual({
        publico: 5,
        restrito: 4,
        confidencial: 1,
      });
      expect(result.documentosPorDestinacaoFinal).toEqual({
        guardaPermanente: 6,
        eliminacao: 4,
      });
      expect(result.documentosElegiveisTransferencia).toBe(2);
      expect(result.armazenamentoTotalBytes).toBe(2048);
    });

    it('fills missing months with total: 0 across the last 6 months including the current month', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-16T12:00:00.000Z'));
      stubAllCounts();
      dashboardRepository.countCriadosPorMes.mockResolvedValue([
        { mes: '2026-07', total: 4 },
        { mes: '2026-05', total: 2 },
      ]);

      const result = await service.getSummary(makeJwtPayload({ role: ROLE.ADMIN }));

      expect(result.documentosCriadosPorMes).toEqual([
        { mes: '2026-02', total: 0 },
        { mes: '2026-03', total: 0 },
        { mes: '2026-04', total: 0 },
        { mes: '2026-05', total: 2 },
        { mes: '2026-06', total: 0 },
        { mes: '2026-07', total: 4 },
      ]);
    });

    it('requests documentosCriadosPorMes since the first day of 5 months ago (UTC)', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-16T12:00:00.000Z'));
      stubAllCounts();

      await service.getSummary(makeJwtPayload({ role: ROLE.ADMIN }));

      expect(dashboardRepository.countCriadosPorMes).toHaveBeenCalledWith(
        null,
        new Date(Date.UTC(2026, 1, 1)),
      );
    });
  });

  describe('getAdminSummary', () => {
    it('assembles documentosPorDepartamento, totalUsuariosAtivos and totalDepartamentos without resolving any access scope', async () => {
      dashboardRepository.countPorDepartamento.mockResolvedValue([
        { departamentoId: 'dept-1', departamentoNome: 'Financeiro', totalDocumentos: 12 },
      ]);
      dashboardRepository.countUsuariosAtivos.mockResolvedValue(8);
      dashboardRepository.countDepartamentos.mockResolvedValue(3);

      const result = await service.getAdminSummary();

      expect(dashboardRepository.countPorDepartamento).toHaveBeenCalledWith();
      expect(dashboardRepository.countUsuariosAtivos).toHaveBeenCalledWith();
      expect(dashboardRepository.countDepartamentos).toHaveBeenCalledWith();
      expect(userDepartmentsService.findByUserId).not.toHaveBeenCalled();
      expect(result).toEqual({
        documentosPorDepartamento: [
          { departamentoId: 'dept-1', departamentoNome: 'Financeiro', totalDocumentos: 12 },
        ],
        totalUsuariosAtivos: 8,
        totalDepartamentos: 3,
      });
    });
  });
});
