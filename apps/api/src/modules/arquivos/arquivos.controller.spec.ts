import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ARQUIVO_STATUS, ROLE } from '@ged/database';
import type { Arquivo, Department } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import type { HttpRequest } from '../../common/interfaces/http-request.interface';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ArquivosController } from './arquivos.controller';
import { ArquivosService } from './arquivos.service';
import type { CreateArquivoDto } from './dto/create-arquivo.dto';

const makeArquivo = (overrides: Partial<Arquivo> = {}): Arquivo =>
  ({
    id: 'arquivo-1',
    codigo: '2026-001',
    ano: 2026,
    sequencia: 1,
    nome: 'Contratos 2026',
    descricao: null,
    status: ARQUIVO_STATUS.ABERTO,
    dataEncerramento: null,
    encerradoPorId: null,
    predio: null,
    sala: null,
    estante: null,
    prateleira: null,
    caixa: null,
    departamentoId: 'dept-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    departamento: {} as Department,
    ...overrides,
  }) as Arquivo;

const makeJwtPayload = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  sub: 'admin-uuid',
  email: 'admin@ged.local',
  role: ROLE.ADMIN,
  ...overrides,
});

const makeHttpRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest' },
  ...overrides,
});

describe('ArquivosController', () => {
  let controller: ArquivosController;
  let arquivosService: jest.Mocked<
    Pick<
      ArquivosService,
      | 'findAll'
      | 'findOne'
      | 'findDepartamentoIds'
      | 'findDepartamentoIdsByArquivos'
      | 'countDossiesByArquivo'
      | 'create'
      | 'update'
      | 'encerrar'
      | 'reabrir'
      | 'remove'
    >
  >;
  let auditLogsService: jest.Mocked<Pick<AuditLogsService, 'log'>>;

  beforeEach(async () => {
    arquivosService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findDepartamentoIds: jest.fn().mockResolvedValue([]),
      findDepartamentoIdsByArquivos: jest.fn().mockResolvedValue(new Map()),
      countDossiesByArquivo: jest.fn().mockResolvedValue(new Map()),
      create: jest.fn(),
      update: jest.fn(),
      encerrar: jest.fn(),
      reabrir: jest.fn(),
      remove: jest.fn(),
    };

    auditLogsService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArquivosController],
      providers: [
        { provide: ArquivosService, useValue: arquivosService },
        { provide: AuditLogsService, useValue: auditLogsService },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ArquivosController);
  });

  describe('findAll', () => {
    it('should return a paginated list of ArquivoResponseDto', async () => {
      arquivosService.findAll.mockResolvedValue({
        data: [makeArquivo()],
        total: 1,
        page: 1,
        limit: 20,
      });

      const result = await controller.findAll({}, makeJwtPayload());

      expect(result.total).toBe(1);
      expect(result.data[0]).toEqual(expect.objectContaining({ id: 'arquivo-1', codigo: '2026-001' }));
    });

    it('should resolve departamentoIds and dossiesCount in a single batch query, not per row', async () => {
      arquivosService.findAll.mockResolvedValue({
        data: [makeArquivo({ id: 'arquivo-1' }), makeArquivo({ id: 'arquivo-2' })],
        total: 2,
        page: 1,
        limit: 20,
      });
      arquivosService.findDepartamentoIdsByArquivos.mockResolvedValue(
        new Map([['arquivo-1', ['dept-2']]]),
      );
      arquivosService.countDossiesByArquivo.mockResolvedValue(new Map([['arquivo-2', 3]]));

      const result = await controller.findAll({}, makeJwtPayload());

      expect(arquivosService.findDepartamentoIds).not.toHaveBeenCalled();
      expect(arquivosService.findDepartamentoIdsByArquivos).toHaveBeenCalledTimes(1);
      expect(arquivosService.findDepartamentoIdsByArquivos).toHaveBeenCalledWith([
        'arquivo-1',
        'arquivo-2',
      ]);
      expect(arquivosService.countDossiesByArquivo).toHaveBeenCalledTimes(1);
      expect(result.data[0]).toEqual(
        expect.objectContaining({ id: 'arquivo-1', departamentoIds: ['dept-2'], dossiesCount: 0 }),
      );
      expect(result.data[1]).toEqual(
        expect.objectContaining({ id: 'arquivo-2', departamentoIds: [], dossiesCount: 3 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an arquivo by id with departamentoIds', async () => {
      arquivosService.findOne.mockResolvedValue(makeArquivo());
      arquivosService.findDepartamentoIds.mockResolvedValue(['dept-2']);

      const result = await controller.findOne('arquivo-1', makeJwtPayload());

      expect(result.id).toBe('arquivo-1');
      expect(result.departamentoIds).toEqual(['dept-2']);
    });

    it('should throw NotFoundException when arquivo does not exist', async () => {
      arquivosService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('non-existent', makeJwtPayload())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create an arquivo and log the action', async () => {
      const created = makeArquivo();
      arquivosService.create.mockResolvedValue(created);
      const dto: CreateArquivoDto = { nome: 'Contratos 2026', departamentoId: 'dept-1' };

      const result = await controller.create(makeHttpRequest(), makeJwtPayload(), dto);

      expect(result.id).toBe('arquivo-1');
      expect(arquivosService.create).toHaveBeenCalledWith(dto);
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'admin-uuid',
          acao: 'CRIAR_ARQUIVO',
          entidade: 'Arquivo',
          entidadeId: 'arquivo-1',
        }),
      );
    });
  });

  describe('encerrar / reabrir', () => {
    it('should encerrar an arquivo and log the action', async () => {
      arquivosService.findOne.mockResolvedValue(makeArquivo());
      arquivosService.encerrar.mockResolvedValue(makeArquivo({ status: ARQUIVO_STATUS.FECHADO }));

      const result = await controller.encerrar(makeHttpRequest(), makeJwtPayload(), 'arquivo-1');

      expect(result.status).toBe(ARQUIVO_STATUS.FECHADO);
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ acao: 'ENCERRAR_ARQUIVO', entidadeId: 'arquivo-1' }),
      );
    });

    it('should reabrir an arquivo and log the action', async () => {
      arquivosService.findOne.mockResolvedValue(makeArquivo({ status: ARQUIVO_STATUS.FECHADO }));
      arquivosService.reabrir.mockResolvedValue(makeArquivo({ status: ARQUIVO_STATUS.ABERTO }));

      const result = await controller.reabrir(makeHttpRequest(), makeJwtPayload(), 'arquivo-1');

      expect(result.status).toBe(ARQUIVO_STATUS.ABERTO);
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ acao: 'REABRIR_ARQUIVO', entidadeId: 'arquivo-1' }),
      );
    });
  });

  describe('remove', () => {
    it('should delete an arquivo and log the action', async () => {
      arquivosService.findOne.mockResolvedValue(makeArquivo());
      arquivosService.remove.mockResolvedValue(undefined);

      await expect(
        controller.remove(makeHttpRequest(), makeJwtPayload(), 'arquivo-1'),
      ).resolves.toBeUndefined();
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ acao: 'REMOVER_ARQUIVO', entidadeId: 'arquivo-1', dadosNovos: null }),
      );
    });
  });
});
