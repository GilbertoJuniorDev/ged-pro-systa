import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  UserPermissionsService,
  USER_PERMISSIONS_REPOSITORY,
} from './user-permissions.service';
import type { IUserPermissionRepository } from './interfaces/user-permission-repository.interface';
import type { UserPermission } from '@ged/database';

const mockUp = (overrides: Partial<UserPermission> = {}): UserPermission =>
  ({
    id: 'up-1',
    usuarioId: 'user-1',
    permissaoId: 'perm-1',
    usuario: null as unknown as UserPermission['usuario'],
    permissao: null as unknown as UserPermission['permissao'],
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }) as UserPermission;

describe('UserPermissionsService', () => {
  let service: UserPermissionsService;
  let mockRepository: jest.Mocked<IUserPermissionRepository>;

  beforeEach(async () => {
    mockRepository = {
      findByUserId: jest.fn(),
      findOne: jest.fn(),
      assign: jest.fn(),
      revoke: jest.fn(),
      hasPermission: jest.fn(),
    };

    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        UserPermissionsService,
        { provide: USER_PERMISSIONS_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = testModule.get<UserPermissionsService>(UserPermissionsService);
  });

  describe('findByUserId', () => {
    it('should return all permissions for a user', async () => {
      const items = [mockUp()];
      mockRepository.findByUserId.mockResolvedValue(items);

      const result = await service.findByUserId('user-1');

      expect(result).toEqual(items);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('assign', () => {
    it('should assign a permission when not already assigned', async () => {
      const up = mockUp();
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.assign.mockResolvedValue(up);

      const result = await service.assign('user-1', 'perm-1');

      expect(result).toEqual(up);
      expect(mockRepository.assign).toHaveBeenCalledWith('user-1', 'perm-1');
    });

    it('should throw ConflictException when permission already assigned', async () => {
      mockRepository.findOne.mockResolvedValue(mockUp());

      await expect(service.assign('user-1', 'perm-1')).rejects.toThrow(ConflictException);
      expect(mockRepository.assign).not.toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('should revoke a permission when it exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockUp());
      mockRepository.revoke.mockResolvedValue(undefined);

      await expect(service.revoke('user-1', 'perm-1')).resolves.toBeUndefined();
      expect(mockRepository.revoke).toHaveBeenCalledWith('user-1', 'perm-1');
    });

    it('should throw NotFoundException when assignment does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.revoke('user-1', 'perm-1')).rejects.toThrow(NotFoundException);
      expect(mockRepository.revoke).not.toHaveBeenCalled();
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has the permission', async () => {
      mockRepository.hasPermission.mockResolvedValue(true);

      const result = await service.hasPermission('user-1', 'documents:read');

      expect(result).toBe(true);
    });

    it('should return false when user does not have the permission', async () => {
      mockRepository.hasPermission.mockResolvedValue(false);

      const result = await service.hasPermission('user-1', 'documents:delete');

      expect(result).toBe(false);
    });
  });
});
import type { IUsuarioPermissaoRepository } from './interfaces/usuario-permissao-repository.interface';
import type { UsuarioPermissao } from '@ged/database';

const mockUp = (overrides: Partial<UsuarioPermissao> = {}): UsuarioPermissao =>
  ({
    id: 'up-1',
    usuarioId: 'user-1',
    permissaoId: 'perm-1',
    usuario: null as unknown as UsuarioPermissao['usuario'],
    permissao: null as unknown as UsuarioPermissao['permissao'],
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }) as UsuarioPermissao;

describe('UsuarioPermissoesService', () => {
  let service: UsuarioPermissoesService;
  let mockRepository: jest.Mocked<IUsuarioPermissaoRepository>;

  beforeEach(async () => {
    mockRepository = {
      findByUsuarioId: jest.fn(),
      findOne: jest.fn(),
      assign: jest.fn(),
      revoke: jest.fn(),
      hasPermissao: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuarioPermissoesService,
        { provide: USUARIO_PERMISSAO_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsuarioPermissoesService>(UsuarioPermissoesService);
  });

  describe('findByUsuarioId', () => {
    it('should return all permissions for a user', async () => {
      const items = [mockUp()];
      mockRepository.findByUsuarioId.mockResolvedValue(items);

      const result = await service.findByUsuarioId('user-1');

      expect(result).toEqual(items);
      expect(mockRepository.findByUsuarioId).toHaveBeenCalledWith('user-1');
    });
  });

  describe('assign', () => {
    it('should assign a permission when not already assigned', async () => {
      const up = mockUp();
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.assign.mockResolvedValue(up);

      const result = await service.assign('user-1', 'perm-1');

      expect(result).toEqual(up);
      expect(mockRepository.assign).toHaveBeenCalledWith('user-1', 'perm-1');
    });

    it('should throw ConflictException when permission already assigned', async () => {
      mockRepository.findOne.mockResolvedValue(mockUp());

      await expect(service.assign('user-1', 'perm-1')).rejects.toThrow(ConflictException);
      expect(mockRepository.assign).not.toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('should revoke a permission when it exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockUp());
      mockRepository.revoke.mockResolvedValue(undefined);

      await expect(service.revoke('user-1', 'perm-1')).resolves.toBeUndefined();
      expect(mockRepository.revoke).toHaveBeenCalledWith('user-1', 'perm-1');
    });

    it('should throw NotFoundException when assignment does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.revoke('user-1', 'perm-1')).rejects.toThrow(NotFoundException);
      expect(mockRepository.revoke).not.toHaveBeenCalled();
    });
  });

  describe('hasPermissao', () => {
    it('should return true when user has the permission', async () => {
      mockRepository.hasPermissao.mockResolvedValue(true);

      const result = await service.hasPermissao('user-1', 'documents:read');

      expect(result).toBe(true);
    });

    it('should return false when user does not have the permission', async () => {
      mockRepository.hasPermissao.mockResolvedValue(false);

      const result = await service.hasPermissao('user-1', 'documents:delete');

      expect(result).toBe(false);
    });
  });
});
