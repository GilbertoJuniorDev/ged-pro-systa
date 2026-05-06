import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PermissoesService, PERMISSAO_REPOSITORY } from './permissoes.service';
import type { IPermissaoRepository } from './interfaces/permissao-repository.interface';
import type { Permissao } from '@ged/database';

const mockPermissao = (overrides: Partial<Permissao> = {}): Permissao =>
  ({
    id: 'perm-1',
    nome: 'documents:read',
    descricao: null,
    moduloId: null,
    modulo: null,
    usuarioPermissoes: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as Permissao;

describe('PermissoesService', () => {
  let service: PermissoesService;
  let mockRepository: jest.Mocked<IPermissaoRepository>;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByNome: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissoesService,
        { provide: PERMISSAO_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<PermissoesService>(PermissoesService);
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      const permissoes = [mockPermissao()];
      mockRepository.findAll.mockResolvedValue(permissoes);

      const result = await service.findAll();

      expect(result).toEqual(permissoes);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return a permission when found', async () => {
      const permissao = mockPermissao();
      mockRepository.findById.mockResolvedValue(permissao);

      const result = await service.findById('perm-1');

      expect(result).toEqual(permissao);
    });

    it('should throw NotFoundException when permission not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a permission when nome is unique', async () => {
      const permissao = mockPermissao();
      mockRepository.findByNome.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(permissao);

      const result = await service.create({ nome: 'documents:read' });

      expect(result).toEqual(permissao);
      expect(mockRepository.create).toHaveBeenCalledWith({ nome: 'documents:read' });
    });

    it('should create a permission with moduloId when provided', async () => {
      const permissao = mockPermissao({ moduloId: 'mod-uuid-1' });
      mockRepository.findByNome.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(permissao);

      const result = await service.create({ nome: 'documents:read', moduloId: 'mod-uuid-1' });

      expect(result.moduloId).toBe('mod-uuid-1');
      expect(mockRepository.create).toHaveBeenCalledWith({ nome: 'documents:read', moduloId: 'mod-uuid-1' });
    });

    it('should throw ConflictException when nome already exists', async () => {
      mockRepository.findByNome.mockResolvedValue(mockPermissao());

      await expect(
        service.create({ nome: 'documents:read' }),
      ).rejects.toThrow(ConflictException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a permission when it exists and nome is unique', async () => {
      const permissao = mockPermissao();
      const updated = mockPermissao({ nome: 'documents:write' });
      mockRepository.findById.mockResolvedValue(permissao);
      mockRepository.findByNome.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('perm-1', { nome: 'documents:write' });

      expect(result).toEqual(updated);
    });

    it('should update moduloId to null when explicitly set', async () => {
      const permissao = mockPermissao({ moduloId: 'mod-uuid-1' });
      const updated = mockPermissao({ moduloId: null });
      mockRepository.findById.mockResolvedValue(permissao);
      mockRepository.findByNome.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('perm-1', { moduloId: null });

      expect(result.moduloId).toBeNull();
    });

    it('should throw NotFoundException when permission does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { nome: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when nome belongs to a different permission', async () => {
      mockRepository.findById.mockResolvedValue(mockPermissao({ id: 'perm-1' }));
      mockRepository.findByNome.mockResolvedValue(mockPermissao({ id: 'perm-2' }));

      await expect(
        service.update('perm-1', { nome: 'documents:write' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a permission when it exists', async () => {
      mockRepository.findById.mockResolvedValue(mockPermissao());
      mockRepository.remove.mockResolvedValue(undefined);

      await expect(service.remove('perm-1')).resolves.toBeUndefined();
      expect(mockRepository.remove).toHaveBeenCalledWith('perm-1');
    });

    it('should throw NotFoundException when permission does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });
});
