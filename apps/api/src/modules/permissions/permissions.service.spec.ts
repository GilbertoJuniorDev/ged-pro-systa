import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PermissionsService, PERMISSION_REPOSITORY } from './permissions.service';
import type { IPermissionRepository } from './interfaces/permission-repository.interface';
import type { Permission } from '@ged/database';

const mockPermission = (overrides: Partial<Permission> = {}): Permission =>
  ({
    id: 'perm-1',
    nome: 'documents:read',
    descricao: null,
    moduloId: null,
    modulo: null,
    userPermissions: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as Permission;

describe('PermissionsService', () => {
  let service: PermissionsService;
  let mockRepository: jest.Mocked<IPermissionRepository>;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByNome: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: PERMISSION_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = testModule.get<PermissionsService>(PermissionsService);
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      const permissions = [mockPermission()];
      mockRepository.findAll.mockResolvedValue(permissions);

      const result = await service.findAll();

      expect(result).toEqual(permissions);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return a permission when found', async () => {
      const permission = mockPermission();
      mockRepository.findById.mockResolvedValue(permission);

      const result = await service.findById('perm-1');

      expect(result).toEqual(permission);
    });

    it('should throw NotFoundException when permission not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a permission when nome is unique', async () => {
      const permission = mockPermission();
      mockRepository.findByNome.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(permission);

      const result = await service.create({ nome: 'documents:read' });

      expect(result).toEqual(permission);
      expect(mockRepository.create).toHaveBeenCalledWith({ nome: 'documents:read' });
    });

    it('should create a permission with moduloId when provided', async () => {
      const permission = mockPermission({ moduloId: 'mod-uuid-1' });
      mockRepository.findByNome.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(permission);

      const result = await service.create({ nome: 'documents:read', moduloId: 'mod-uuid-1' });

      expect(result.moduloId).toBe('mod-uuid-1');
      expect(mockRepository.create).toHaveBeenCalledWith({ nome: 'documents:read', moduloId: 'mod-uuid-1' });
    });

    it('should throw ConflictException when nome already exists', async () => {
      mockRepository.findByNome.mockResolvedValue(mockPermission());

      await expect(
        service.create({ nome: 'documents:read' }),
      ).rejects.toThrow(ConflictException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a permission when it exists and nome is unique', async () => {
      const permission = mockPermission();
      const updated = mockPermission({ nome: 'documents:write' });
      mockRepository.findById.mockResolvedValue(permission);
      mockRepository.findByNome.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('perm-1', { nome: 'documents:write' });

      expect(result).toEqual(updated);
    });

    it('should update moduloId to null when explicitly set', async () => {
      const permission = mockPermission({ moduloId: 'mod-uuid-1' });
      const updated = mockPermission({ moduloId: null });
      mockRepository.findById.mockResolvedValue(permission);
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
      mockRepository.findById.mockResolvedValue(mockPermission({ id: 'perm-1' }));
      mockRepository.findByNome.mockResolvedValue(mockPermission({ id: 'perm-2' }));

      await expect(
        service.update('perm-1', { nome: 'documents:write' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a permission when it exists', async () => {
      mockRepository.findById.mockResolvedValue(mockPermission());
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
