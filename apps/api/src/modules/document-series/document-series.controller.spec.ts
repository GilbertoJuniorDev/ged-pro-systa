import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Department, DESTINACAO_FINAL, ROLE } from '@ged/database';
import type { DocumentSeries } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import type { HttpRequest } from '../../common/interfaces/http-request.interface';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UserDepartmentsService } from '../user-departments/user-departments.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { DocumentSeriesController } from './document-series.controller';
import {
  DocumentSeriesService,
  DOCUMENT_SERIES_REPOSITORY,
} from './document-series.service';
import type { CreateDocumentSeriesDto } from './dto/create-document-series.dto';
import type { UpdateDocumentSeriesDto } from './dto/update-document-series.dto';
import type { QueryDocumentSeriesDto } from './dto/query-document-series.dto';

const makeDocumentSeries = (overrides: Partial<DocumentSeries> = {}): DocumentSeries =>
  ({
    id: 'serie-1',
    codigo: 'SF-001',
    nome: 'Contratos',
    descricao: null,
    prazoCorrenteMeses: 12,
    prazoIntermediarioMeses: 24,
    destinacaoFinal: DESTINACAO_FINAL.GUARDA_PERMANENTE,
    baseLegal: null,
    isActive: true,
    departamentoId: 'dept-1',
    seriePaiId: null,
    seriePai: null,
    seriesFilhas: [],
    departamento: undefined,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as DocumentSeries;

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

describe('DocumentSeriesController', () => {
  let controller: DocumentSeriesController;
  let documentSeriesService: jest.Mocked<DocumentSeriesService>;
  let auditLogsService: jest.Mocked<Pick<AuditLogsService, 'log'>>;

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByDepartamentoAndCodigo: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockDepartmentRepo = {
      findOne: jest.fn(),
    };

    auditLogsService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentSeriesController],
      providers: [
        DocumentSeriesService,
        { provide: DOCUMENT_SERIES_REPOSITORY, useValue: mockRepository },
        { provide: getRepositoryToken(Department), useValue: mockDepartmentRepo },
        { provide: AuditLogsService, useValue: auditLogsService },
        { provide: UserDepartmentsService, useValue: { findByUserId: jest.fn() } },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(DocumentSeriesController);
    documentSeriesService = module.get(
      DocumentSeriesService,
    ) as jest.Mocked<DocumentSeriesService>;
  });

  describe('findAll', () => {
    it('should return list of document series as DocumentSeriesResponseDto', async () => {
      const series = [
        makeDocumentSeries(),
        makeDocumentSeries({ id: 'serie-2', codigo: 'SF-002' }),
      ];
      jest.spyOn(documentSeriesService, 'findAll').mockResolvedValue(series);
      const query: QueryDocumentSeriesDto = {};
      const user = makeJwtPayload();

      const result = await controller.findAll(query, user);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({ id: 'serie-1', codigo: 'SF-001' }),
      );
      expect(documentSeriesService.findAll).toHaveBeenCalledWith(undefined, user);
    });

    it('should filter by departamentoId when provided', async () => {
      const series = [makeDocumentSeries()];
      jest.spyOn(documentSeriesService, 'findAll').mockResolvedValue(series);
      const query: QueryDocumentSeriesDto = { departamentoId: 'dept-1' };
      const user = makeJwtPayload();

      await controller.findAll(query, user);

      expect(documentSeriesService.findAll).toHaveBeenCalledWith('dept-1', user);
    });
  });

  describe('findOne', () => {
    it('should return a document series by id', async () => {
      jest.spyOn(documentSeriesService, 'findOne').mockResolvedValue(makeDocumentSeries());
      const user = makeJwtPayload();

      const result = await controller.findOne('serie-1', user);

      expect(result.id).toBe('serie-1');
      expect(documentSeriesService.findOne).toHaveBeenCalledWith('serie-1', user);
    });

    it('should throw NotFoundException when document series does not exist', async () => {
      jest
        .spyOn(documentSeriesService, 'findOne')
        .mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('non-existent', makeJwtPayload())).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a document series and log the action', async () => {
      const created = makeDocumentSeries();
      jest.spyOn(documentSeriesService, 'create').mockResolvedValue(created);
      const dto: CreateDocumentSeriesDto = {
        codigo: 'SF-001',
        nome: 'Contratos',
        prazoCorrenteMeses: 12,
        prazoIntermediarioMeses: 24,
        destinacaoFinal: DESTINACAO_FINAL.GUARDA_PERMANENTE,
        departamentoId: 'dept-1',
      };

      const result = await controller.create(makeHttpRequest(), makeJwtPayload(), dto);

      expect(result.id).toBe('serie-1');
      expect(documentSeriesService.create).toHaveBeenCalledWith(dto);
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'admin-uuid',
          acao: 'CRIAR_SERIE',
          entidade: 'DocumentSeries',
          entidadeId: 'serie-1',
        }),
      );
    });

    it('should throw ConflictException when codigo already exists', async () => {
      jest
        .spyOn(documentSeriesService, 'create')
        .mockRejectedValue(new ConflictException());
      const dto: CreateDocumentSeriesDto = {
        codigo: 'SF-001',
        nome: 'Contratos',
        prazoCorrenteMeses: 12,
        prazoIntermediarioMeses: 24,
        destinacaoFinal: DESTINACAO_FINAL.GUARDA_PERMANENTE,
        departamentoId: 'dept-1',
      };

      await expect(
        controller.create(makeHttpRequest(), makeJwtPayload(), dto),
      ).rejects.toThrow(ConflictException);
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a document series and log before/after data', async () => {
      const before = makeDocumentSeries();
      const updated = makeDocumentSeries({ nome: 'Contratos v2' });
      jest.spyOn(documentSeriesService, 'findOne').mockResolvedValue(before);
      jest.spyOn(documentSeriesService, 'update').mockResolvedValue(updated);
      const dto: UpdateDocumentSeriesDto = { nome: 'Contratos v2' };

      const result = await controller.update(
        makeHttpRequest(),
        makeJwtPayload(),
        'serie-1',
        dto,
      );

      expect(result.nome).toBe('Contratos v2');
      expect(documentSeriesService.update).toHaveBeenCalledWith('serie-1', dto);
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'ATUALIZAR_SERIE',
          entidade: 'DocumentSeries',
          entidadeId: 'serie-1',
          dadosAnteriores: expect.objectContaining({ nome: 'Contratos' }),
          dadosNovos: expect.objectContaining({ nome: 'Contratos v2' }),
        }),
      );
    });

    it('should throw NotFoundException when document series does not exist', async () => {
      jest
        .spyOn(documentSeriesService, 'findOne')
        .mockRejectedValue(new NotFoundException());

      await expect(
        controller.update(makeHttpRequest(), makeJwtPayload(), 'non-existent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a document series and log the action', async () => {
      jest.spyOn(documentSeriesService, 'findOne').mockResolvedValue(makeDocumentSeries());
      jest.spyOn(documentSeriesService, 'remove').mockResolvedValue(undefined);

      await expect(
        controller.remove(makeHttpRequest(), makeJwtPayload(), 'serie-1'),
      ).resolves.toBeUndefined();
      expect(documentSeriesService.remove).toHaveBeenCalledWith('serie-1');
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          acao: 'DELETAR_SERIE',
          entidade: 'DocumentSeries',
          entidadeId: 'serie-1',
          dadosNovos: null,
        }),
      );
    });

    it('should throw NotFoundException when document series does not exist', async () => {
      jest
        .spyOn(documentSeriesService, 'findOne')
        .mockRejectedValue(new NotFoundException());

      await expect(
        controller.remove(makeHttpRequest(), makeJwtPayload(), 'non-existent'),
      ).rejects.toThrow(NotFoundException);
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when document series has linked documents', async () => {
      jest.spyOn(documentSeriesService, 'findOne').mockResolvedValue(makeDocumentSeries());
      jest
        .spyOn(documentSeriesService, 'remove')
        .mockRejectedValue(new ConflictException());

      await expect(
        controller.remove(makeHttpRequest(), makeJwtPayload(), 'serie-1'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
