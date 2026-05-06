import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ModulosService, MODULO_REPOSITORY } from './modulos.service';
import type { IModuloRepository } from './interfaces/modulo-repository.interface';
import type { Modulo } from '@ged/database';

const mockModulo = (overrides: Partial<Modulo> = {}): Modulo =>
  ({
    id: 'mod-1',
    nome: 'Documentos',
    slug: 'documentos',
    descricao: null,
    icone: null,
    ordem: 0,
    isActive: true,
    permissoes: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as Modulo;

describe('ModulosService', () => {
  let service: ModulosService;
  let mockRepository: jest.Mocked<IModuloRepository>;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModulosService,
        { provide: MODULO_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ModulosService>(ModulosService);
  });

  describe('findAll', () => {
    it('should return all modulos', async () => {
      const modulos = [mockModulo()];
      mockRepository.findAll.mockResolvedValue(modulos);

      const result = await service.findAll();

      expect(result).toEqual(modulos);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return a modulo when found', async () => {
      const modulo = mockModulo();
      mockRepository.findById.mockResolvedValue(modulo);

      const result = await service.findById('mod-1');

      expect(result).toEqual(modulo);
    });

    it('should throw NotFoundException when modulo not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a modulo when nome and slug are unique', async () => {
      const modulo = mockModulo();
      mockRepository.findAll.mockResolvedValue([]);
      mockRepository.findBySlug.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(modulo);

      const result = await service.create({ nome: 'Documentos', slug: 'documentos' });

      expect(result).toEqual(modulo);
      expect(mockRepository.create).toHaveBeenCalledWith({ nome: 'Documentos', slug: 'documentos' });
    });

    it('should throw ConflictException when nome already exists', async () => {
      mockRepository.findAll.mockResolvedValue([mockModulo()]);
      mockRepository.findBySlug.mockResolvedValue(null);

      await expect(
        service.create({ nome: 'Documentos', slug: 'outro-slug' }),
      ).rejects.toThrow(ConflictException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when slug already exists', async () => {
      mockRepository.findAll.mockResolvedValue([]);
      mockRepository.findBySlug.mockResolvedValue(mockModulo());

      await expect(
        service.create({ nome: 'Outro Nome', slug: 'documentos' }),
      ).rejects.toThrow(ConflictException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a modulo when it exists and slug is unique', async () => {
      const modulo = mockModulo();
      const updated = mockModulo({ nome: 'Documentos v2' });
      mockRepository.findById.mockResolvedValue(modulo);
      mockRepository.findBySlug.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('mod-1', { nome: 'Documentos v2' });

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when modulo does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent', { nome: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when slug belongs to a different modulo', async () => {
      mockRepository.findById.mockResolvedValue(mockModulo({ id: 'mod-1' }));
      mockRepository.findBySlug.mockResolvedValue(mockModulo({ id: 'mod-2' }));

      await expect(
        service.update('mod-1', { slug: 'documentos' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating slug when it belongs to the same modulo', async () => {
      const modulo = mockModulo({ id: 'mod-1', slug: 'documentos' });
      const updated = mockModulo({ id: 'mod-1', slug: 'docs' });
      mockRepository.findById.mockResolvedValue(modulo);
      mockRepository.findBySlug.mockResolvedValue(modulo); // same id
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('mod-1', { slug: 'docs' });

      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should remove a modulo when it exists', async () => {
      mockRepository.findById.mockResolvedValue(mockModulo());
      mockRepository.remove.mockResolvedValue(undefined);

      await expect(service.remove('mod-1')).resolves.toBeUndefined();
      expect(mockRepository.remove).toHaveBeenCalledWith('mod-1');
    });

    it('should throw NotFoundException when modulo does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });
});
