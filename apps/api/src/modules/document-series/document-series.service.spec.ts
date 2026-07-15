import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Department, DESTINACAO_FINAL, ROLE } from '@ged/database';
import type { DocumentSeries, UserDepartment } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import type { Repository } from 'typeorm';
import { UserDepartmentsService } from '../user-departments/user-departments.service';
import {
  DocumentSeriesService,
  DOCUMENT_SERIES_REPOSITORY,
} from './document-series.service';
import type { IDocumentSeriesRepository } from './interfaces/document-series-repository.interface';

const makeJwtPayload = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  sub: 'user-1',
  email: 'user@ged.local',
  role: ROLE.ADMIN,
  ...overrides,
});

const makeUserDepartment = (departamentoId: string): UserDepartment =>
  ({ departamentoId }) as UserDepartment;

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

const makeDepartment = (overrides: Partial<Department> = {}): Department =>
  ({
    id: 'dept-1',
    nome: 'Financeiro',
    descricao: null,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    usuarioDepartamentos: [],
    ...overrides,
  }) as Department;

describe('DocumentSeriesService', () => {
  let service: DocumentSeriesService;
  let mockRepository: jest.Mocked<IDocumentSeriesRepository>;
  let mockDepartmentRepo: jest.Mocked<Pick<Repository<Department>, 'findOne'>>;
  let mockUserDepartmentsService: jest.Mocked<Pick<UserDepartmentsService, 'findByUserId'>>;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByDepartamentoAndCodigo: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockDepartmentRepo = {
      findOne: jest.fn(),
    };

    mockUserDepartmentsService = { findByUserId: jest.fn() };

    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentSeriesService,
        { provide: DOCUMENT_SERIES_REPOSITORY, useValue: mockRepository },
        { provide: getRepositoryToken(Department), useValue: mockDepartmentRepo },
        { provide: UserDepartmentsService, useValue: mockUserDepartmentsService },
      ],
    }).compile();

    service = testModule.get<DocumentSeriesService>(DocumentSeriesService);
  });

  describe('findAll', () => {
    it('should return all document series filtered by departamentoId for a privileged user', async () => {
      const series = [makeDocumentSeries()];
      mockRepository.findAll.mockResolvedValue(series);

      const result = await service.findAll('dept-1', makeJwtPayload({ role: ROLE.ADMIN }));

      expect(result).toEqual(series);
      expect(mockRepository.findAll).toHaveBeenCalledWith({ departamentoId: 'dept-1' });
      expect(mockUserDepartmentsService.findByUserId).not.toHaveBeenCalled();
    });

    it('should return all document series when no departamentoId is given for a privileged user', async () => {
      const series = [makeDocumentSeries()];
      mockRepository.findAll.mockResolvedValue(series);

      const result = await service.findAll(undefined, makeJwtPayload({ role: ROLE.ADMIN }));

      expect(result).toEqual(series);
      expect(mockRepository.findAll).toHaveBeenCalledWith({ departamentoId: undefined });
    });

    it('should scope a VIEWER to their departamentos via allowedDepartamentoIds', async () => {
      const series = [makeDocumentSeries()];
      mockRepository.findAll.mockResolvedValue(series);
      mockUserDepartmentsService.findByUserId.mockResolvedValue([
        makeUserDepartment('dept-1'),
        makeUserDepartment('dept-2'),
      ]);

      const result = await service.findAll(
        undefined,
        makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER }),
      );

      expect(result).toEqual(series);
      expect(mockRepository.findAll).toHaveBeenCalledWith({
        allowedDepartamentoIds: ['dept-1', 'dept-2'],
      });
    });

    it('should return an empty list without querying when a VIEWER has no departamentos', async () => {
      mockUserDepartmentsService.findByUserId.mockResolvedValue([]);

      const result = await service.findAll(
        undefined,
        makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER }),
      );

      expect(result).toEqual([]);
      expect(mockRepository.findAll).not.toHaveBeenCalled();
    });

    it('should return an empty list when a VIEWER filters by a departamento outside their scope', async () => {
      mockUserDepartmentsService.findByUserId.mockResolvedValue([makeUserDepartment('dept-1')]);

      const result = await service.findAll(
        'dept-9',
        makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER }),
      );

      expect(result).toEqual([]);
      expect(mockRepository.findAll).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a document series when found', async () => {
      const documentSeries = makeDocumentSeries();
      mockRepository.findById.mockResolvedValue(documentSeries);

      const result = await service.findOne('serie-1');

      expect(result).toEqual(documentSeries);
    });

    it('should throw NotFoundException when document series not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should return the series for a VIEWER of the same departamento', async () => {
      mockRepository.findById.mockResolvedValue(makeDocumentSeries({ departamentoId: 'dept-1' }));
      mockUserDepartmentsService.findByUserId.mockResolvedValue([makeUserDepartment('dept-1')]);

      const result = await service.findOne(
        'serie-1',
        makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER }),
      );

      expect(result.departamentoId).toBe('dept-1');
    });

    it('should throw NotFoundException when a VIEWER accesses a series outside their departamentos', async () => {
      mockRepository.findById.mockResolvedValue(makeDocumentSeries({ departamentoId: 'dept-2' }));
      mockUserDepartmentsService.findByUserId.mockResolvedValue([makeUserDepartment('dept-1')]);

      await expect(
        service.findOne('serie-1', makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER })),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createData = {
      codigo: 'SF-001',
      nome: 'Contratos',
      prazoCorrenteMeses: 12,
      prazoIntermediarioMeses: 24,
      destinacaoFinal: DESTINACAO_FINAL.GUARDA_PERMANENTE,
      departamentoId: 'dept-1',
    };

    it('should create a document series when department exists and codigo is unique', async () => {
      const documentSeries = makeDocumentSeries();
      mockDepartmentRepo.findOne.mockResolvedValue(makeDepartment());
      mockRepository.findByDepartamentoAndCodigo.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(documentSeries);

      const result = await service.create(createData);

      expect(result).toEqual(documentSeries);
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
    });

    it('should throw BadRequestException when department does not exist', async () => {
      mockDepartmentRepo.findOne.mockResolvedValue(null);

      await expect(service.create(createData)).rejects.toThrow(BadRequestException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when codigo already exists in department', async () => {
      mockDepartmentRepo.findOne.mockResolvedValue(makeDepartment());
      mockRepository.findByDepartamentoAndCodigo.mockResolvedValue(makeDocumentSeries());

      await expect(service.create(createData)).rejects.toThrow(ConflictException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when seriePai does not exist', async () => {
      mockDepartmentRepo.findOne.mockResolvedValue(makeDepartment());
      mockRepository.findByDepartamentoAndCodigo.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.create({ ...createData, seriePaiId: 'parent-1' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when seriePai belongs to a different department', async () => {
      mockDepartmentRepo.findOne.mockResolvedValue(makeDepartment());
      mockRepository.findByDepartamentoAndCodigo.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue(
        makeDocumentSeries({ id: 'parent-1', departamentoId: 'dept-2' }),
      );

      await expect(
        service.create({ ...createData, seriePaiId: 'parent-1' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a document series when it exists and codigo is unique', async () => {
      const current = makeDocumentSeries();
      const updated = makeDocumentSeries({ nome: 'Contratos v2' });
      mockRepository.findById.mockResolvedValue(current);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('serie-1', { nome: 'Contratos v2' });

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when document series does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent', { nome: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when new codigo already exists in department', async () => {
      const current = makeDocumentSeries();
      mockRepository.findById.mockResolvedValue(current);
      mockRepository.findByDepartamentoAndCodigo.mockResolvedValue(
        makeDocumentSeries({ id: 'other-serie', codigo: 'SF-002' }),
      );

      await expect(
        service.update('serie-1', { codigo: 'SF-002' }),
      ).rejects.toThrow(ConflictException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should not re-check codigo uniqueness when codigo is unchanged', async () => {
      const current = makeDocumentSeries();
      mockRepository.findById.mockResolvedValue(current);
      mockRepository.update.mockResolvedValue(current);

      await service.update('serie-1', { codigo: current.codigo });

      expect(mockRepository.findByDepartamentoAndCodigo).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when seriePaiId is the record itself', async () => {
      const current = makeDocumentSeries({ id: 'serie-1' });
      mockRepository.findById.mockResolvedValue(current);

      await expect(
        service.update('serie-1', { seriePaiId: 'serie-1' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when seriePai does not exist', async () => {
      const current = makeDocumentSeries({ id: 'serie-1' });
      mockRepository.findById.mockImplementation((id: string) =>
        Promise.resolve(id === 'serie-1' ? current : null),
      );

      await expect(
        service.update('serie-1', { seriePaiId: 'parent-1' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when seriePai belongs to a different department', async () => {
      const current = makeDocumentSeries({ id: 'serie-1', departamentoId: 'dept-1' });
      const parent = makeDocumentSeries({ id: 'parent-1', departamentoId: 'dept-2' });
      mockRepository.findById.mockImplementation((id: string) =>
        Promise.resolve(id === 'serie-1' ? current : id === 'parent-1' ? parent : null),
      );

      await expect(
        service.update('serie-1', { seriePaiId: 'parent-1' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException on circular hierarchy reference', async () => {
      // serie-1 -> (proposed parent) serie-2 -> serie-3 -> serie-1 (cycle)
      const serie1 = makeDocumentSeries({ id: 'serie-1', departamentoId: 'dept-1' });
      const serie2 = makeDocumentSeries({
        id: 'serie-2',
        departamentoId: 'dept-1',
        seriePaiId: 'serie-3',
      });
      const serie3 = makeDocumentSeries({
        id: 'serie-3',
        departamentoId: 'dept-1',
        seriePaiId: 'serie-1',
      });
      const byId: Record<string, DocumentSeries> = {
        'serie-1': serie1,
        'serie-2': serie2,
        'serie-3': serie3,
      };
      mockRepository.findById.mockImplementation((id: string) =>
        Promise.resolve(byId[id] ?? null),
      );

      await expect(
        service.update('serie-1', { seriePaiId: 'serie-2' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('should allow setting a valid, non-circular seriePaiId', async () => {
      const current = makeDocumentSeries({ id: 'serie-1', departamentoId: 'dept-1' });
      const parent = makeDocumentSeries({
        id: 'parent-1',
        departamentoId: 'dept-1',
        seriePaiId: null,
      });
      const updated = makeDocumentSeries({ id: 'serie-1', seriePaiId: 'parent-1' });
      mockRepository.findById.mockImplementation((id: string) =>
        Promise.resolve(id === 'serie-1' ? current : id === 'parent-1' ? parent : null),
      );
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('serie-1', { seriePaiId: 'parent-1' });

      expect(result).toEqual(updated);
      expect(mockRepository.update).toHaveBeenCalledWith('serie-1', {
        seriePaiId: 'parent-1',
      });
    });
  });

  describe('remove', () => {
    it('should remove a document series when it exists', async () => {
      mockRepository.findById.mockResolvedValue(makeDocumentSeries());
      mockRepository.delete.mockResolvedValue(undefined);

      await expect(service.remove('serie-1')).resolves.toBeUndefined();
      expect(mockRepository.delete).toHaveBeenCalledWith('serie-1');
    });

    it('should throw NotFoundException when document series does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should translate a 23503 FK violation into ConflictException', async () => {
      mockRepository.findById.mockResolvedValue(makeDocumentSeries());
      mockRepository.delete.mockRejectedValue({ code: '23503' });

      await expect(service.remove('serie-1')).rejects.toThrow(ConflictException);
    });

    it('should rethrow other errors from delete', async () => {
      mockRepository.findById.mockResolvedValue(makeDocumentSeries());
      const otherError = new Error('unexpected');
      mockRepository.delete.mockRejectedValue(otherError);

      await expect(service.remove('serie-1')).rejects.toThrow(otherError);
    });
  });
});
