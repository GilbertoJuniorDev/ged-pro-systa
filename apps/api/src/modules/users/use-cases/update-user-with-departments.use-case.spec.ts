import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import type { DataSource, EntityManager } from 'typeorm';
import { ROLE, User } from '@ged/database';
import { UpdateUserWithDepartmentsUseCase } from './update-user-with-departments.use-case';
import { UserDepartmentsService } from '../../user-departments/user-departments.service';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'uuid-1',
    name: 'Usuário Teste',
    email: 'teste@ged.local',
    role: ROLE.VIEWER,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as User;

function makeMockManager(existingUser: User | null): jest.Mocked<Partial<EntityManager>> {
  return {
    findOne: jest.fn().mockResolvedValue(existingUser),
    save: jest.fn().mockImplementation((_entity, data) => Promise.resolve(data)),
  } as jest.Mocked<Partial<EntityManager>>;
}

function makeMockDataSource(
  manager: jest.Mocked<Partial<EntityManager>>,
): jest.Mocked<Partial<DataSource>> {
  return {
    transaction: jest.fn().mockImplementation((cb: (em: unknown) => unknown) => cb(manager)),
  } as jest.Mocked<Partial<DataSource>>;
}

describe('UpdateUserWithDepartmentsUseCase', () => {
  let useCase: UpdateUserWithDepartmentsUseCase;
  let mockManager: jest.Mocked<Partial<EntityManager>>;
  let mockDataSource: jest.Mocked<Partial<DataSource>>;
  let mockUserDepartmentsService: jest.Mocked<Pick<UserDepartmentsService, 'syncForUser'>>;

  beforeEach(async () => {
    mockManager = makeMockManager(makeUser());
    mockDataSource = makeMockDataSource(mockManager);
    mockUserDepartmentsService = { syncForUser: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        UpdateUserWithDepartmentsUseCase,
        { provide: getDataSourceToken(), useValue: mockDataSource },
        { provide: UserDepartmentsService, useValue: mockUserDepartmentsService },
      ],
    }).compile();

    useCase = module.get(UpdateUserWithDepartmentsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should apply a normal name update within a transaction', async () => {
    const result = await useCase.execute({
      id: 'uuid-1',
      actingUserRole: ROLE.ADMIN,
      data: { name: 'Nome Novo' },
    });

    expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
    expect(mockManager.save).toHaveBeenCalledWith(
      User,
      expect.objectContaining({ name: 'Nome Novo' }),
    );
    expect(result).toMatchObject({ name: 'Nome Novo' });
    expect(mockUserDepartmentsService.syncForUser).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when the user does not exist', async () => {
    mockManager.findOne = jest.fn().mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 'nonexistent', actingUserRole: ROLE.ADMIN, data: {} }),
    ).rejects.toThrow(new NotFoundException('Usuário não encontrado'));
    expect(mockManager.save).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when an ADMIN actor tries to assign the ADMIN role', async () => {
    await expect(
      useCase.execute({
        id: 'uuid-1',
        actingUserRole: ROLE.ADMIN,
        data: { role: ROLE.ADMIN },
      }),
    ).rejects.toThrow(new ForbiddenException('Você não tem permissão para atribuir esta função'));
    expect(mockManager.save).not.toHaveBeenCalled();
  });

  it('should allow a SUPER_ADMIN actor to assign the ADMIN role', async () => {
    const result = await useCase.execute({
      id: 'uuid-1',
      actingUserRole: ROLE.SUPER_ADMIN,
      data: { role: ROLE.ADMIN },
    });

    expect(result).toMatchObject({ role: ROLE.ADMIN });
  });

  it('should throw ForbiddenException when the target user is a SUPER_ADMIN and role is being changed', async () => {
    mockManager = makeMockManager(makeUser({ role: ROLE.SUPER_ADMIN }));
    mockDataSource = makeMockDataSource(mockManager);
    const module = await Test.createTestingModule({
      providers: [
        UpdateUserWithDepartmentsUseCase,
        { provide: getDataSourceToken(), useValue: mockDataSource },
        { provide: UserDepartmentsService, useValue: mockUserDepartmentsService },
      ],
    }).compile();
    useCase = module.get(UpdateUserWithDepartmentsUseCase);

    await expect(
      useCase.execute({
        id: 'uuid-1',
        actingUserRole: ROLE.SUPER_ADMIN,
        data: { role: ROLE.ADMIN },
      }),
    ).rejects.toThrow(new ForbiddenException('Não é possível alterar o papel do Super Admin'));
    expect(mockManager.save).not.toHaveBeenCalled();
  });

  it('should call userDepartmentsService.syncForUser with the transaction manager when departamentoIds is provided', async () => {
    await useCase.execute({
      id: 'uuid-1',
      actingUserRole: ROLE.ADMIN,
      data: {},
      departamentoIds: ['dept-1', 'dept-2'],
    });

    expect(mockUserDepartmentsService.syncForUser).toHaveBeenCalledWith(
      'uuid-1',
      ['dept-1', 'dept-2'],
      mockManager,
    );
  });

  it('should not call userDepartmentsService.syncForUser when departamentoIds is undefined', async () => {
    await useCase.execute({
      id: 'uuid-1',
      actingUserRole: ROLE.ADMIN,
      data: { name: 'Só o nome' },
    });

    expect(mockUserDepartmentsService.syncForUser).not.toHaveBeenCalled();
  });
});
