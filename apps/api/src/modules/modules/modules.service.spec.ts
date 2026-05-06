import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ModulesService, MODULE_REPOSITORY } from './modules.service';
import type { IModuleRepository } from './interfaces/module-repository.interface';
import type { Module as ModuleEntity } from '@ged/database';

const mockModule = (overrides: Partial<ModuleEntity> = {}): ModuleEntity =>
  ({
    id: 'mod-1',
    nome: 'Documents',
    slug: 'documents',
    descricao: null,
    icone: null,
    ordem: 0,
    isActive: true,
    permissions: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as ModuleEntity;

describe('ModulesService', () => {
  let service: ModulesService;
  let mockRepository: jest.Mocked<IModuleRepository>;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        ModulesService,
        { provide: MODULE_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = testModule.get<ModulesService>(ModulesService);
  });

  describe('findAll', () => {
    it('should return all modules', async () => {
      const modules = [mockModule()];
      mockRepository.findAll.mockResolvedValue(modules);

      const result = await service.findAll();

      expect(result).toEqual(modules);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return a module when found', async () => {
      const module = mockModule();
      mockRepository.findById.mockResolvedValue(module);

      const result = await service.findById('mod-1');

      expect(result).toEqual(module);
    });

    it('should throw NotFoundException when module not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a module when nome and slug are unique', async () => {
      const module = mockModule();
      mockRepository.findAll.mockResolvedValue([]);
      mockRepository.findBySlug.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(module);

      const result = await service.create({ nome: 'Documents', slug: 'documents' });

      expect(result).toEqual(module);
      expect(mockRepository.create).toHaveBeenCalledWith({ nome: 'Documents', slug: 'documents' });
    });

    it('should throw ConflictException when nome already exists', async () => {
      mockRepository.findAll.mockResolvedValue([mockModule()]);
      mockRepository.findBySlug.mockResolvedValue(null);

      await expect(
        service.create({ nome: 'Documents', slug: 'other-slug' }),
      ).rejects.toThrow(ConflictException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when slug already exists', async () => {
      mockRepository.findAll.mockResolvedValue([]);
      mockRepository.findBySlug.mockResolvedValue(mockModule());

      await expect(
        service.create({ nome: 'Other Name', slug: 'documents' }),
      ).rejects.toThrow(ConflictException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a module when it exists and slug is unique', async () => {
      const module = mockModule();
      const updated = mockModule({ nome: 'Documents v2' });
      mockRepository.findById.mockResolvedValue(module);
      mockRepository.findBySlug.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('mod-1', { nome: 'Documents v2' });

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when module does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent', { nome: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when slug belongs to a different module', async () => {
      mockRepository.findById.mockResolvedValue(mockModule({ id: 'mod-1' }));
      mockRepository.findBySlug.mockResolvedValue(mockModule({ id: 'mod-2' }));

      await expect(
        service.update('mod-1', { slug: 'documents' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating slug when it belongs to the same module', async () => {
      const module = mockModule({ id: 'mod-1', slug: 'documents' });
      const updated = mockModule({ id: 'mod-1', slug: 'docs' });
      mockRepository.findById.mockResolvedValue(module);
      mockRepository.findBySlug.mockResolvedValue(module); // same id
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('mod-1', { slug: 'docs' });

      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should remove a module when it exists', async () => {
      mockRepository.findById.mockResolvedValue(mockModule());
      mockRepository.remove.mockResolvedValue(undefined);

      await expect(service.remove('mod-1')).resolves.toBeUndefined();
      expect(mockRepository.remove).toHaveBeenCalledWith('mod-1');
    });

    it('should throw NotFoundException when module does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });
});
