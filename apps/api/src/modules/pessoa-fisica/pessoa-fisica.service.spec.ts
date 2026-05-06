import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  PessoaFisicaService,
  PESSOA_FISICA_REPOSITORY,
  ENDERECO_REPOSITORY,
  TELEFONE_REPOSITORY,
} from './pessoa-fisica.service';
import type { IPessoaFisicaRepository } from './interfaces/pessoa-fisica-repository.interface';
import type { IEnderecoRepository } from './interfaces/endereco-repository.interface';
import type { ITelefoneRepository } from './interfaces/telefone-repository.interface';
import type { Endereco, PessoaFisica, Telefone } from '@ged/database';

const mockPf = (overrides: Partial<PessoaFisica> = {}): PessoaFisica =>
  ({
    id: 'pf-1',
    userId: 'user-1',
    nome: 'João',
    sobrenome: 'Silva',
    cpf: '12345678901',
    dataNascimento: new Date('1990-01-01'),
    sexo: 'M' as const,
    enderecos: [],
    telefones: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as PessoaFisica;

const mockEndereco = (overrides: Partial<Endereco> = {}): Endereco =>
  ({
    id: 'end-1',
    pessoaFisicaId: 'pf-1',
    tipo: 'RESIDENCIAL' as const,
    logradouro: 'Rua A',
    numero: '10',
    complemento: null,
    bairro: 'Centro',
    cidade: 'SP',
    estado: 'SP',
    cep: '01310100',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as Endereco;

describe('PessoaFisicaService', () => {
  let service: PessoaFisicaService;
  let mockPfRepository: jest.Mocked<IPessoaFisicaRepository>;
  let mockEnderecoRepository: jest.Mocked<IEnderecoRepository>;
  let mockTelefoneRepository: jest.Mocked<ITelefoneRepository>;

  beforeEach(async () => {
    mockPfRepository = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findByCpf: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    mockEnderecoRepository = {
      findByPessoaFisicaId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    mockTelefoneRepository = {
      findByPessoaFisicaId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as jest.Mocked<ITelefoneRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PessoaFisicaService,
        { provide: PESSOA_FISICA_REPOSITORY, useValue: mockPfRepository },
        { provide: ENDERECO_REPOSITORY, useValue: mockEnderecoRepository },
        { provide: TELEFONE_REPOSITORY, useValue: mockTelefoneRepository },
      ],
    }).compile();

    service = module.get<PessoaFisicaService>(PessoaFisicaService);
  });

  describe('create', () => {
    const baseData = {
      userId: 'user-1',
      nome: 'João',
      sobrenome: 'Silva',
      cpf: '12345678901',
      dataNascimento: new Date('1990-01-01'),
      sexo: 'M' as const,
    };

    it('should create pessoa fisica when data is valid', async () => {
      const pf = mockPf();
      mockPfRepository.findByUserId.mockResolvedValue(null);
      mockPfRepository.findByCpf.mockResolvedValue(null);
      mockPfRepository.create.mockResolvedValue(pf);

      const result = await service.create('user-1', 'VIEWER', 'user-1', baseData);

      expect(result).toEqual(pf);
      expect(mockPfRepository.create).toHaveBeenCalledWith(baseData);
    });

    it('should throw ConflictException when user already has a profile', async () => {
      mockPfRepository.findByUserId.mockResolvedValue(mockPf());

      await expect(
        service.create('user-1', 'VIEWER', 'user-1', baseData),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when CPF is already registered', async () => {
      mockPfRepository.findByUserId.mockResolvedValue(null);
      mockPfRepository.findByCpf.mockResolvedValue(mockPf({ userId: 'other-user' }));

      await expect(
        service.create('user-1', 'VIEWER', 'user-1', baseData),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException when requester is not owner and not ADMIN', async () => {
      await expect(
        service.create('other-user', 'MANAGER', 'user-1', baseData),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to create profile for any user', async () => {
      const pf = mockPf();
      mockPfRepository.findByUserId.mockResolvedValue(null);
      mockPfRepository.findByCpf.mockResolvedValue(null);
      mockPfRepository.create.mockResolvedValue(pf);

      const result = await service.create('admin-id', 'ADMIN', 'user-1', baseData);

      expect(result).toEqual(pf);
    });
  });

  describe('update', () => {
    it('should update when requester is the owner', async () => {
      const pf = mockPf();
      const updated = mockPf({ nome: 'José' });
      mockPfRepository.findByUserId.mockResolvedValue(pf);
      mockPfRepository.update.mockResolvedValue(updated);

      const result = await service.update('user-1', 'VIEWER', 'user-1', { nome: 'José' });

      expect(result).toEqual(updated);
    });

    it('should throw ForbiddenException when requester is not owner and not ADMIN', async () => {
      await expect(
        service.update('other-user', 'MANAGER', 'user-1', { nome: 'José' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockPfRepository.findByUserId.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'VIEWER', 'user-1', { nome: 'José' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeEndereco', () => {
    it('should throw NotFoundException when address belongs to a different user', async () => {
      const pf = mockPf({ id: 'pf-1' });
      const endereco = mockEndereco({ pessoaFisicaId: 'pf-2' }); // pertence a outro
      mockPfRepository.findByUserId.mockResolvedValue(pf);
      mockEnderecoRepository.findById.mockResolvedValue(endereco);

      await expect(
        service.removeEndereco('user-1', 'VIEWER', 'user-1', 'end-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
