import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import type { DataSource, EntityManager } from 'typeorm';
import { Permissao, PessoaFisica, User, UsuarioPermissao } from '@ged/database';
import { CreateUserWithProfileUseCase } from './create-user-with-profile.use-case';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

const mockPfData = {
  nome: 'Ana',
  sobrenome: 'Souza',
  cpf: '12345678901',
  dataNascimento: '1990-05-15',
  sexo: 'F' as const,
};

const mockCreateData = {
  name: 'Ana Souza',
  email: 'ana@test.com',
  password: 'Password123',
  role: 'VIEWER' as const,
  pessoaFisica: mockPfData,
};

function makeMockManager(overrides?: Partial<EntityManager>): jest.Mocked<Partial<EntityManager>> {
  return {
    findOne: jest.fn().mockResolvedValue(null),
    findBy: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation((_entity, data) => data),
    save: jest.fn().mockImplementation((_entity, data) => Promise.resolve({ id: 'uuid-1', ...data })),
    ...overrides,
  } as jest.Mocked<Partial<EntityManager>>;
}

function makeMockDataSource(manager: jest.Mocked<Partial<EntityManager>>): jest.Mocked<Partial<DataSource>> {
  return {
    transaction: jest.fn().mockImplementation((cb: (em: unknown) => unknown) => cb(manager)),
  } as jest.Mocked<Partial<DataSource>>;
}

describe('CreateUserWithProfileUseCase', () => {
  let useCase: CreateUserWithProfileUseCase;
  let mockManager: jest.Mocked<Partial<EntityManager>>;
  let mockDataSource: jest.Mocked<Partial<DataSource>>;

  beforeEach(async () => {
    mockManager = makeMockManager();
    mockDataSource = makeMockDataSource(mockManager);

    const module = await Test.createTestingModule({
      providers: [
        CreateUserWithProfileUseCase,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    useCase = module.get(CreateUserWithProfileUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create user and pessoa fisica within a transaction when data is valid', async () => {
    const result = await useCase.execute(mockCreateData);

    expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
    expect(mockManager.save).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ id: 'uuid-1' });
  });

  it('should hash the password before saving user', async () => {
    const bcrypt = await import('bcrypt');
    await useCase.execute(mockCreateData);

    expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 12);
  });

  it('should throw ConflictException when email is already registered', async () => {
    mockManager.findOne = jest.fn()
      .mockResolvedValueOnce({ id: 'existing-id', email: 'ana@test.com' }); // email conflict

    await expect(useCase.execute(mockCreateData)).rejects.toThrow(
      new ConflictException('E-mail já cadastrado'),
    );
    expect(mockManager.save).not.toHaveBeenCalled();
  });

  it('should throw ConflictException when CPF is already registered', async () => {
    mockManager.findOne = jest.fn()
      .mockResolvedValueOnce(null)                                            // email ok
      .mockResolvedValueOnce({ id: 'existing-pf', cpf: '12345678901' });    // CPF conflict

    await expect(useCase.execute(mockCreateData)).rejects.toThrow(
      new ConflictException('CPF já cadastrado'),
    );
    expect(mockManager.save).not.toHaveBeenCalled();
  });

  it('should rollback if save(PessoaFisica) throws', async () => {
    mockManager.save = jest.fn()
      .mockResolvedValueOnce({ id: 'uuid-1', name: 'Ana Souza' })  // user ok
      .mockRejectedValueOnce(new Error('DB constraint error'));      // pf fail

    await expect(useCase.execute(mockCreateData)).rejects.toThrow('DB constraint error');
  });

  it('should check email uniqueness using User entity', async () => {
    await useCase.execute(mockCreateData);

    expect(mockManager.findOne).toHaveBeenCalledWith(User, {
      where: { email: 'ana@test.com' },
    });
  });

  it('should check CPF uniqueness using PessoaFisica entity', async () => {
    await useCase.execute(mockCreateData);

    expect(mockManager.findOne).toHaveBeenCalledWith(PessoaFisica, {
      where: { cpf: '12345678901' },
    });
  });

  describe('permissaoIds', () => {
    it('should create user without permissions when permissaoIds is not provided', async () => {
      const result = await useCase.execute(mockCreateData);

      expect(mockManager.findBy).not.toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'uuid-1' });
      // save called only for User and PessoaFisica
      expect(mockManager.save).toHaveBeenCalledTimes(2);
    });

    it('should create usuario-permissoes records atomically when permissaoIds are valid', async () => {
      const permissaoId1 = 'aaa00000-0000-4000-a000-000000000001';
      const permissaoId2 = 'aaa00000-0000-4000-a000-000000000002';
      const mockPermissoes = [
        { id: permissaoId1, nome: 'docs:read' } as Permissao,
        { id: permissaoId2, nome: 'docs:write' } as Permissao,
      ];
      mockManager.findBy = jest.fn().mockResolvedValue(mockPermissoes);

      await useCase.execute({ ...mockCreateData, permissaoIds: [permissaoId1, permissaoId2] });

      expect(mockManager.findBy).toHaveBeenCalledWith(Permissao, expect.objectContaining({}));
      // save called for User, PessoaFisica, and UsuarioPermissao[]  
      expect(mockManager.save).toHaveBeenCalledTimes(3);
      expect(mockManager.save).toHaveBeenCalledWith(
        UsuarioPermissao,
        expect.arrayContaining([
          expect.objectContaining({ permissaoId: permissaoId1 }),
          expect.objectContaining({ permissaoId: permissaoId2 }),
        ]),
      );
    });

    it('should throw BadRequestException when one or more permissaoIds do not exist', async () => {
      const validId = 'aaa00000-0000-4000-a000-000000000001';
      const invalidId = 'bbb00000-0000-4000-b000-000000000002';
      // Only one found, two requested
      mockManager.findBy = jest.fn().mockResolvedValue([{ id: validId } as Permissao]);

      await expect(
        useCase.execute({ ...mockCreateData, permissaoIds: [validId, invalidId] }),
      ).rejects.toThrow(new BadRequestException('Uma ou mais permissões não encontradas'));
    });
  });
});
