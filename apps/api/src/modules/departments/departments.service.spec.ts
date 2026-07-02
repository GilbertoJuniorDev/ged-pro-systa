import { Test, type TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DepartmentsService, DEPARTMENT_REPOSITORY } from './departments.service';
import type { IDepartmentRepository } from './interfaces/department-repository.interface';
import type { Department } from '@ged/database';

const mockDepartment = (overrides: Partial<Department> = {}): Department =>
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

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let mockRepository: jest.Mocked<IDepartmentRepository>;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findAllActive: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        { provide: DEPARTMENT_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = testModule.get<DepartmentsService>(DepartmentsService);
  });

  describe('findAll', () => {
    it('should return all departments', async () => {
      const departments = [mockDepartment()];
      mockRepository.findAll.mockResolvedValue(departments);

      const result = await service.findAll();

      expect(result).toEqual(departments);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllActive', () => {
    it('should return only active departments', async () => {
      const departments = [mockDepartment()];
      mockRepository.findAllActive.mockResolvedValue(departments);

      const result = await service.findAllActive();

      expect(result).toEqual(departments);
      expect(mockRepository.findAllActive).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a department when found', async () => {
      const department = mockDepartment();
      mockRepository.findById.mockResolvedValue(department);

      const result = await service.findOne('dept-1');

      expect(result).toEqual(department);
    });

    it('should throw NotFoundException when department not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a department when nome is unique', async () => {
      const department = mockDepartment();
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(department);

      const result = await service.create({ nome: 'Financeiro' });

      expect(result).toEqual(department);
      expect(mockRepository.create).toHaveBeenCalledWith({ nome: 'Financeiro' });
    });

    it('should throw ConflictException when nome already exists', async () => {
      mockRepository.findByName.mockResolvedValue(mockDepartment());

      await expect(service.create({ nome: 'Financeiro' })).rejects.toThrow(ConflictException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a department when it exists and nome is unique', async () => {
      const department = mockDepartment();
      const updated = mockDepartment({ nome: 'Financeiro v2' });
      mockRepository.findById.mockResolvedValue(department);
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('dept-1', { nome: 'Financeiro v2' });

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when department does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent', { nome: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when nome belongs to a different department', async () => {
      mockRepository.findById.mockResolvedValue(mockDepartment({ id: 'dept-1' }));
      mockRepository.findByName.mockResolvedValue(mockDepartment({ id: 'dept-2' }));

      await expect(
        service.update('dept-1', { nome: 'Financeiro' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating nome when it belongs to the same department', async () => {
      const department = mockDepartment({ id: 'dept-1', nome: 'Financeiro' });
      const updated = mockDepartment({ id: 'dept-1', nome: 'Financeiro Corp' });
      mockRepository.findById.mockResolvedValue(department);
      mockRepository.findByName.mockResolvedValue(department); // same id
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('dept-1', { nome: 'Financeiro Corp' });

      expect(result).toEqual(updated);
    });

    it('should allow updating isActive without touching nome uniqueness', async () => {
      const department = mockDepartment();
      const updated = mockDepartment({ isActive: false });
      mockRepository.findById.mockResolvedValue(department);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('dept-1', { isActive: false });

      expect(result).toEqual(updated);
      expect(mockRepository.findByName).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a department when it exists', async () => {
      mockRepository.findById.mockResolvedValue(mockDepartment());
      mockRepository.delete.mockResolvedValue(undefined);

      await expect(service.remove('dept-1')).resolves.toBeUndefined();
      expect(mockRepository.delete).toHaveBeenCalledWith('dept-1');
    });

    it('should throw NotFoundException when department does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
