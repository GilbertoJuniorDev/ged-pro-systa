import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ROLE, RefreshToken } from '@ged/database';
import { UsersService, USER_REPOSITORY } from './users.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { IUserRepository, CreateUserData } from './interfaces/user-repository.interface';
import type { User } from '@ged/database';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-uuid-1',
    name: 'Test User',
    email: 'test@ged.local',
    passwordHash: 'hashed',
    role: 'VIEWER',
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    documents: [],
    refreshTokens: [],
    ...overrides,
  } as User;
}

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: jest.Mocked<IUserRepository>;
  let mockAuditLogsService: { hasLogsByUser: jest.Mock };
  let mockRefreshTokenRepo: { delete: jest.Mock };

  beforeEach(async () => {
    mockRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      updatePassword: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      setActive: jest.fn(),
    };

    mockAuditLogsService = {
      hasLogsByUser: jest.fn(),
    };

    mockRefreshTokenRepo = {
      delete: jest.fn().mockResolvedValue({}),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: mockRepository },
        { provide: AuditLogsService, useValue: mockAuditLogsService },
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshTokenRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findByEmail', () => {
    it('should return user when email exists', async () => {
      const user = makeUser();
      mockRepository.findByEmail.mockResolvedValue(user);

      const result = await service.findByEmail('test@ged.local');

      expect(result).toEqual(user);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('test@ged.local');
    });

    it('should return null when email does not exist', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@ged.local');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when id exists', async () => {
      const user = makeUser();
      mockRepository.findById.mockResolvedValue(user);

      const result = await service.findById('user-uuid-1');

      expect(result).toEqual(user);
      expect(mockRepository.findById).toHaveBeenCalledWith('user-uuid-1');
    });

    it('should return null when id does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.findById('nonexistent-uuid');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users when caller is SUPER_ADMIN', async () => {
      const users = [
        makeUser(),
        makeUser({ id: 'user-uuid-2', email: 'other@ged.local' }),
        makeUser({ id: 'user-uuid-3', email: 'super@ged.local', role: ROLE.SUPER_ADMIN }),
      ];
      mockRepository.findAll.mockResolvedValue(users);

      const result = await service.findAll(ROLE.SUPER_ADMIN);

      expect(result).toHaveLength(3);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should filter out SUPER_ADMIN users when caller is not SUPER_ADMIN', async () => {
      const users = [
        makeUser(),
        makeUser({ id: 'user-uuid-2', email: 'other@ged.local' }),
        makeUser({ id: 'user-uuid-3', email: 'super@ged.local', role: ROLE.SUPER_ADMIN }),
      ];
      mockRepository.findAll.mockResolvedValue(users);

      const result = await service.findAll(ROLE.ADMIN);

      expect(result).toHaveLength(2);
      expect(result.some((user) => user.role === ROLE.SUPER_ADMIN)).toBe(false);
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const data: CreateUserData = {
        name: 'New User',
        email: 'new@ged.local',
        passwordHash: 'hashed-password',
        role: 'VIEWER',
      };
      const created = makeUser({ ...data });
      mockRepository.create.mockResolvedValue(created);

      const result = await service.create(data);

      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalledWith(data);
    });
  });

  describe('update', () => {
    it('should update user when found', async () => {
      const existing = makeUser();
      const updated = makeUser({ name: 'Novo Nome', role: 'VIEWER' });
      mockRepository.findById.mockResolvedValue(existing);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('user-uuid-1', { name: 'Novo Nome', role: 'VIEWER' });

      expect(result.name).toBe('Novo Nome');
      expect(mockRepository.update).toHaveBeenCalledWith('user-uuid-1', {
        name: 'Novo Nome',
        role: 'VIEWER',
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove user when found and not self', async () => {
      mockRepository.findById.mockResolvedValue(makeUser());
      mockAuditLogsService.hasLogsByUser.mockResolvedValue(false);
      mockRepository.remove.mockResolvedValue(undefined);

      await expect(service.remove('user-uuid-1', 'admin-uuid')).resolves.toBeUndefined();
      expect(mockRepository.remove).toHaveBeenCalledWith('user-uuid-1');
    });

    it('should throw BadRequestException when user has audit logs', async () => {
      mockRepository.findById.mockResolvedValue(makeUser());
      mockAuditLogsService.hasLogsByUser.mockResolvedValue(true);

      await expect(service.remove('user-uuid-1', 'admin-uuid')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when removing own account', async () => {
      await expect(service.remove('user-uuid-1', 'user-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('nonexistent', 'admin-uuid')).rejects.toThrow(NotFoundException);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when removing a SUPER_ADMIN target', async () => {
      mockRepository.findById.mockResolvedValue(makeUser({ role: ROLE.SUPER_ADMIN }));

      await expect(service.remove('super-admin-uuid', 'admin-uuid')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('setActive', () => {
    it('should deactivate user when found and not self', async () => {
      const deactivated = makeUser({ isActive: false });
      mockRepository.findById.mockResolvedValue(makeUser());
      mockRepository.setActive.mockResolvedValue(deactivated);

      const result = await service.setActive('user-uuid-1', false, 'admin-uuid');

      expect(result.isActive).toBe(false);
      expect(mockRepository.setActive).toHaveBeenCalledWith('user-uuid-1', false);
    });

    it('should revoke refresh tokens when deactivating a user', async () => {
      mockRepository.findById.mockResolvedValue(makeUser());
      mockRepository.setActive.mockResolvedValue(makeUser({ isActive: false }));

      await service.setActive('user-uuid-1', false, 'admin-uuid');

      expect(mockRefreshTokenRepo.delete).toHaveBeenCalledWith({ userId: 'user-uuid-1' });
    });

    it('should NOT revoke refresh tokens when activating a user', async () => {
      mockRepository.findById.mockResolvedValue(makeUser({ isActive: false }));
      mockRepository.setActive.mockResolvedValue(makeUser({ isActive: true }));

      await service.setActive('user-uuid-1', true, 'admin-uuid');

      expect(mockRefreshTokenRepo.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when changing own status', async () => {
      await expect(service.setActive('user-uuid-1', false, 'user-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.setActive).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.setActive('nonexistent', false, 'admin-uuid')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.setActive).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when deactivating a SUPER_ADMIN target', async () => {
      mockRepository.findById.mockResolvedValue(makeUser({ role: ROLE.SUPER_ADMIN }));

      await expect(service.setActive('super-admin-uuid', false, 'admin-uuid')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.setActive).not.toHaveBeenCalled();
    });
  });
});
