import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ROLE } from '@ged/database';
import type { User, UserDepartment } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import type { HttpRequest } from '../../common/interfaces/http-request.interface';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UsersController } from './users.controller';
import { UsersService, USER_REPOSITORY } from './users.service';
import { type CreateUserDto } from './dto/create-user.dto';
import { type UpdateUserDto } from './dto/update-user.dto';
import { type ToggleUserStatusDto } from './dto/toggle-user-status.dto';
import { CreateUserWithProfileUseCase } from './use-cases/create-user-with-profile.use-case';
import { UpdateUserWithDepartmentsUseCase } from './use-cases/update-user-with-departments.use-case';
import { UserDepartmentsService } from '../user-departments/user-departments.service';

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

const makeCreateUserDto = (overrides: Partial<CreateUserDto> = {}): CreateUserDto => ({
  name: 'Novo Usuário',
  email: 'novo@example.com',
  password: 'Password123',
  pessoaFisica: {
    nome: 'Novo',
    sobrenome: 'Usuário',
    cpf: '12345678901',
    dataNascimento: '1990-05-15',
    sexo: 'F',
  },
  ...overrides,
});

const makeHttpRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  user: makeJwtPayload(),
  ip: '127.0.0.1',
  headers: { 'user-agent': 'jest' },
  ...overrides,
});

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;
  let createUserWithProfileUseCase: jest.Mocked<Pick<CreateUserWithProfileUseCase, 'execute'>>;
  let updateUserWithDepartmentsUseCase: jest.Mocked<Pick<UpdateUserWithDepartmentsUseCase, 'execute'>>;
  let userDepartmentsService: jest.Mocked<
    Pick<UserDepartmentsService, 'findByUserId' | 'findByUserIds'>
  >;
  let auditLogsService: jest.Mocked<Pick<AuditLogsService, 'log'>>;

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

    createUserWithProfileUseCase = {
      execute: jest.fn(),
    };

    updateUserWithDepartmentsUseCase = {
      execute: jest.fn(),
    };

    userDepartmentsService = {
      findByUserId: jest.fn().mockResolvedValue([]),
      findByUserIds: jest.fn().mockResolvedValue(new Map<string, UserDepartment[]>()),
    };

    auditLogsService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: mockRepository },
        { provide: CreateUserWithProfileUseCase, useValue: createUserWithProfileUseCase },
        { provide: UpdateUserWithDepartmentsUseCase, useValue: updateUserWithDepartmentsUseCase },
        { provide: UserDepartmentsService, useValue: userDepartmentsService },
        { provide: AuditLogsService, useValue: auditLogsService },
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
      createUserWithProfileUseCase.execute.mockResolvedValue(makeUser());
      const dto = makeCreateUserDto();
      const currentUser = makeJwtPayload();

      const result = await controller.create(makeHttpRequest(), dto, currentUser);

      expect(result.id).toBe('uuid-1');
      expect(result.email).toBe('novo@example.com');
      expect(result.departamentoIds).toEqual([]);
      expect(result).not.toHaveProperty('passwordHash');
      expect(createUserWithProfileUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Novo Usuário',
          email: 'novo@example.com',
          password: 'Password123',
          actingUserRole: ROLE.ADMIN,
          pessoaFisica: dto.pessoaFisica,
        }),
      );
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'admin-uuid',
          acao: 'CRIAR_USUARIO',
          entidade: 'User',
          entidadeId: 'uuid-1',
        }),
      );
    });

    it('should use provided role when creating user', async () => {
      createUserWithProfileUseCase.execute.mockResolvedValue(makeUser({ role: ROLE.MANAGER }));
      const dto = makeCreateUserDto({
        name: 'Gerente',
        email: 'gerente@example.com',
        role: ROLE.MANAGER,
      });

      await controller.create(makeHttpRequest(), dto, makeJwtPayload());

      expect(createUserWithProfileUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ role: ROLE.MANAGER }),
      );
    });

    it('should echo the requested departamentoIds in the response', async () => {
      createUserWithProfileUseCase.execute.mockResolvedValue(makeUser());
      const deptId = 'dddddddd-0000-4000-a000-000000000001';
      const dto = makeCreateUserDto({ departamentoIds: [deptId] });

      const result = await controller.create(makeHttpRequest(), dto, makeJwtPayload());

      expect(result.departamentoIds).toEqual([deptId]);
      expect(createUserWithProfileUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ departamentoIds: [deptId] }),
      );
    });

    it('should throw ConflictException when email is already taken', async () => {
      createUserWithProfileUseCase.execute.mockRejectedValue(new ConflictException());
      const dto = makeCreateUserDto({
        name: 'Duplicado',
        email: 'novo@example.com',
      });

      await expect(
        controller.create(makeHttpRequest(), dto, makeJwtPayload()),
      ).rejects.toThrow(ConflictException);
    });

    it('should propagate ForbiddenException when the acting user cannot assign the role', async () => {
      createUserWithProfileUseCase.execute.mockRejectedValue(new ForbiddenException());
      const dto = makeCreateUserDto({ role: ROLE.ADMIN });

      await expect(
        controller.create(makeHttpRequest(), dto, makeJwtPayload()),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return list of all users as UserResponseDto', async () => {
      const users = [makeUser(), makeUser({ id: 'uuid-2', email: 'other@example.com' })];
      jest.spyOn(usersService, 'findAll').mockResolvedValue(users);
      const currentUser = makeJwtPayload();

      const result = await controller.findAll(currentUser);

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('passwordHash');
      expect(result[0].departamentoIds).toEqual([]);
      expect(usersService.findAll).toHaveBeenCalledWith(ROLE.ADMIN);
      expect(userDepartmentsService.findByUserIds).toHaveBeenCalledWith(['uuid-1', 'uuid-2']);
    });
  });

  describe('update', () => {
    it('should update and return the user', async () => {
      const updated = makeUser({ name: 'Nome Novo', role: ROLE.MANAGER });
      updateUserWithDepartmentsUseCase.execute.mockResolvedValue(updated);

      const dto: UpdateUserDto = { name: 'Nome Novo', role: ROLE.MANAGER };
      const currentUser = makeJwtPayload();
      const result = await controller.update(makeHttpRequest(), 'uuid-1', dto, currentUser);

      expect(result.name).toBe('Nome Novo');
      expect(result.role).toBe(ROLE.MANAGER);
      expect(updateUserWithDepartmentsUseCase.execute).toHaveBeenCalledWith({
        id: 'uuid-1',
        actingUserRole: ROLE.ADMIN,
        data: { name: 'Nome Novo', role: ROLE.MANAGER },
        departamentoIds: undefined,
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      updateUserWithDepartmentsUseCase.execute.mockRejectedValue(new NotFoundException());

      await expect(
        controller.update(makeHttpRequest(), 'nonexistent', {}, makeJwtPayload()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException when the acting user cannot assign the role', async () => {
      updateUserWithDepartmentsUseCase.execute.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.update(makeHttpRequest(), 'uuid-1', { role: ROLE.ADMIN }, makeJwtPayload()),
      ).rejects.toThrow(ForbiddenException);
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
      await expect(controller.remove(makeHttpRequest(), 'uuid-1', currentUser)).resolves.toBeUndefined();
      expect(usersService.remove).toHaveBeenCalledWith('uuid-1', 'admin-uuid');
    });

    it('should throw BadRequestException when deleting own account', async () => {
      jest.spyOn(usersService, 'remove').mockRejectedValue(new BadRequestException());

      const currentUser = makeJwtPayload({ sub: 'uuid-1' });

      await expect(controller.remove(makeHttpRequest(), 'uuid-1', currentUser)).rejects.toThrow(BadRequestException);
    });
  });
});
