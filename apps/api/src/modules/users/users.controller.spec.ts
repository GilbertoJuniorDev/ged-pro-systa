import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ROLE } from '@ged/database';
import type { User } from '@ged/database';
import { UsersController } from './users.controller';
import { UsersService, USER_REPOSITORY } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

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

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmail' | 'create'>>;

  beforeEach(async () => {
    const mockRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updatePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    controller = module.get(UsersController);
    usersService = module.get(UsersService) as jest.Mocked<
      Pick<UsersService, 'findByEmail' | 'create'>
    >;

    jest.spyOn(usersService, 'findByEmail');
    jest.spyOn(usersService, 'create');
  });

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
