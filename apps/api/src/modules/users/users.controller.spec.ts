import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ROLE } from '@ged/database';
import type { User } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { UsersController } from './users.controller';
import { UsersService, USER_REPOSITORY } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ToggleUserStatusDto } from './dto/toggle-user-status.dto';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'uuid-1',
    name: 'Novo Usuário',
    email: 'novo@example.com',
    role: ROLE.VIEWER,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as User;

const makeJwtPayload = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  sub: 'admin-uuid',
  email: 'admin@ged.local',
  role: ROLE.ADMIN,
  ...overrides,
});

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      updatePassword: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      setActive: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    controller = module.get(UsersController);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;

    jest.spyOn(usersService, 'findByEmail');
    jest.spyOn(usersService, 'findAll');
    jest.spyOn(usersService, 'create');
    jest.spyOn(usersService, 'update');
    jest.spyOn(usersService, 'remove');
    jest.spyOn(usersService, 'setActive');
  });

  describe('create', () => {
    it('should create a user when email is not taken', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'create').mockResolvedValue(makeUser());
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      const dto: CreateUserDto = {
        name: 'Novo Usuário',
        email: 'novo@example.com',
        password: 'Password123',
      };

      const result = await controller.create(dto);

      expect(result.id).toBe('uuid-1');
      expect(result.email).toBe('novo@example.com');
      expect(result).not.toHaveProperty('passwordHash');
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Novo Usuário',
          email: 'novo@example.com',
          passwordHash: 'hashed-password',
          role: ROLE.VIEWER,
        }),
      );
    });

    it('should use provided role when creating user', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest
        .spyOn(usersService, 'create')
        .mockResolvedValue(makeUser({ role: ROLE.MANAGER }));
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      const dto: CreateUserDto = {
        name: 'Gerente',
        email: 'gerente@example.com',
        password: 'Password123',
        role: ROLE.MANAGER,
      };

      await controller.create(dto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: ROLE.MANAGER }),
      );
    });

    it('should throw ConflictException when email is already taken', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(makeUser());

      const dto: CreateUserDto = {
        name: 'Duplicado',
        email: 'novo@example.com',
        password: 'Password123',
      };

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return list of all users as UserResponseDto', async () => {
      const users = [makeUser(), makeUser({ id: 'uuid-2', email: 'other@example.com' })];
      jest.spyOn(usersService, 'findAll').mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('passwordHash');
      expect(usersService.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return the user', async () => {
      const updated = makeUser({ name: 'Nome Novo', role: ROLE.MANAGER });
      jest.spyOn(usersService, 'update').mockResolvedValue(updated);

      const dto: UpdateUserDto = { name: 'Nome Novo', role: ROLE.MANAGER };
      const result = await controller.update('uuid-1', dto);

      expect(result.name).toBe('Nome Novo');
      expect(result.role).toBe(ROLE.MANAGER);
      expect(usersService.update).toHaveBeenCalledWith('uuid-1', dto);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      jest.spyOn(usersService, 'update').mockRejectedValue(new NotFoundException());

      await expect(controller.update('nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('setActive', () => {
    it('should toggle user active status', async () => {
      const deactivated = makeUser({ isActive: false });
      jest.spyOn(usersService, 'setActive').mockResolvedValue(deactivated);

      const dto: ToggleUserStatusDto = { isActive: false };
      const currentUser = makeJwtPayload();
      const result = await controller.setActive('uuid-1', dto, currentUser);

      expect(result.isActive).toBe(false);
      expect(usersService.setActive).toHaveBeenCalledWith('uuid-1', false, 'admin-uuid');
    });

    it('should throw BadRequestException when deactivating own account', async () => {
      jest.spyOn(usersService, 'setActive').mockRejectedValue(new BadRequestException());

      const dto: ToggleUserStatusDto = { isActive: false };
      const currentUser = makeJwtPayload({ sub: 'uuid-1' });

      await expect(controller.setActive('uuid-1', dto, currentUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a user and return no content', async () => {
      jest.spyOn(usersService, 'remove').mockResolvedValue(undefined);

      const currentUser = makeJwtPayload();
      await expect(controller.remove('uuid-1', currentUser)).resolves.toBeUndefined();
      expect(usersService.remove).toHaveBeenCalledWith('uuid-1', 'admin-uuid');
    });

    it('should throw BadRequestException when deleting own account', async () => {
      jest.spyOn(usersService, 'remove').mockRejectedValue(new BadRequestException());

      const currentUser = makeJwtPayload({ sub: 'uuid-1' });

      await expect(controller.remove('uuid-1', currentUser)).rejects.toThrow(BadRequestException);
    });
  });
});
