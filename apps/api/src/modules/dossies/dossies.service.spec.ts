import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Department, ROLE } from '@ged/database';
import type { Dossie, UserDepartment } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { UserDepartmentsService } from '../user-departments/user-departments.service';
import { DossiesService, DOSSIE_REPOSITORY } from './dossies.service';
import type { IDossieRepository } from './interfaces/dossie-repository.interface';

const makeJwtPayload = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  sub: 'user-1',
  email: 'user@ged.local',
  role: ROLE.ADMIN,
  ...overrides,
});

const makeUserDepartment = (departamentoId: string): UserDepartment =>
  ({ departamentoId }) as UserDepartment;

const makeDossie = (overrides: Partial<Dossie> = {}): Dossie =>
  ({
    id: 'dossie-1',
    nome: 'Contratos 2026',
    descricao: null,
    isActive: true,
    departamentoId: 'dept-1',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    departamento: {} as Department,
    ...overrides,
  }) as Dossie;

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

describe('DossiesService', () => {
  let service: DossiesService;
  let mockRepository: jest.Mocked<IDossieRepository>;
  let mockDepartmentRepository: { findOne: jest.Mock };
  let mockUserDepartmentsService: jest.Mocked<Pick<UserDepartmentsService, 'findByUserId'>>;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockDepartmentRepository = {
      findOne: jest.fn(),
    };

    mockUserDepartmentsService = { findByUserId: jest.fn() };

    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        DossiesService,
        { provide: DOSSIE_REPOSITORY, useValue: mockRepository },
        { provide: getRepositoryToken(Department), useValue: mockDepartmentRepository },
        { provide: UserDepartmentsService, useValue: mockUserDepartmentsService },
      ],
    }).compile();

    service = testModule.get<DossiesService>(DossiesService);
  });

  describe('findAll', () => {
    it('should return all dossiês for a privileged user', async () => {
      const dossies = [makeDossie()];
      mockRepository.findAll.mockResolvedValue(dossies);

      const result = await service.findAll(undefined, makeJwtPayload({ role: ROLE.ADMIN }));

      expect(result).toEqual(dossies);
      expect(mockRepository.findAll).toHaveBeenCalledWith({ departamentoId: undefined });
      expect(mockUserDepartmentsService.findByUserId).not.toHaveBeenCalled();
    });

    it('should filter by departamentoId when provided by a privileged user', async () => {
      const dossies = [makeDossie()];
      mockRepository.findAll.mockResolvedValue(dossies);

      const result = await service.findAll('dept-1', makeJwtPayload({ role: ROLE.ADMIN }));

      expect(result).toEqual(dossies);
      expect(mockRepository.findAll).toHaveBeenCalledWith({ departamentoId: 'dept-1' });
    });

    it("should scope a VIEWER to their departamentos via allowedDepartamentoIds", async () => {
      const dossies = [makeDossie()];
      mockRepository.findAll.mockResolvedValue(dossies);
      mockUserDepartmentsService.findByUserId.mockResolvedValue([
        makeUserDepartment('dept-1'),
        makeUserDepartment('dept-2'),
      ]);

      const result = await service.findAll(
        undefined,
        makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER }),
      );

      expect(result).toEqual(dossies);
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
    it('should return a dossiê when found', async () => {
      const dossie = makeDossie();
      mockRepository.findById.mockResolvedValue(dossie);

      const result = await service.findOne('dossie-1');

      expect(result).toEqual(dossie);
    });

    it('should throw NotFoundException when dossiê not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should return the dossiê for a VIEWER of the same departamento', async () => {
      mockRepository.findById.mockResolvedValue(makeDossie({ departamentoId: 'dept-1' }));
      mockUserDepartmentsService.findByUserId.mockResolvedValue([makeUserDepartment('dept-1')]);

      const result = await service.findOne(
        'dossie-1',
        makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER }),
      );

      expect(result.departamentoId).toBe('dept-1');
    });

    it('should throw NotFoundException when a VIEWER accesses a dossiê outside their departamentos', async () => {
      mockRepository.findById.mockResolvedValue(makeDossie({ departamentoId: 'dept-2' }));
      mockUserDepartmentsService.findByUserId.mockResolvedValue([makeUserDepartment('dept-1')]);

      await expect(
        service.findOne('dossie-1', makeJwtPayload({ sub: 'viewer-1', role: ROLE.VIEWER })),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a dossiê when departamento exists', async () => {
      const dossie = makeDossie();
      mockDepartmentRepository.findOne.mockResolvedValue(makeDepartment());
      mockRepository.create.mockResolvedValue(dossie);

      const result = await service.create({ nome: 'Contratos 2026', departamentoId: 'dept-1' });

      expect(result).toEqual(dossie);
      expect(mockDepartmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'dept-1' },
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        nome: 'Contratos 2026',
        departamentoId: 'dept-1',
      });
    });

    it('should throw BadRequestException when departamento does not exist', async () => {
      mockDepartmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({ nome: 'Contratos 2026', departamentoId: 'non-existent' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a dossiê when it exists', async () => {
      const dossie = makeDossie();
      const updated = makeDossie({ nome: 'Contratos 2026 v2' });
      mockRepository.findById.mockResolvedValue(dossie);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('dossie-1', { nome: 'Contratos 2026 v2' });

      expect(result).toEqual(updated);
      expect(mockRepository.update).toHaveBeenCalledWith('dossie-1', {
        nome: 'Contratos 2026 v2',
      });
    });

    it('should throw NotFoundException when dossiê does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent', { nome: 'x' })).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a dossiê when it exists', async () => {
      mockRepository.findById.mockResolvedValue(makeDossie());
      mockRepository.delete.mockResolvedValue(undefined);

      await expect(service.remove('dossie-1')).resolves.toBeUndefined();
      expect(mockRepository.delete).toHaveBeenCalledWith('dossie-1');
    });

    it('should throw NotFoundException when dossiê does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
