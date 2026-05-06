import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  PhysicalPersonService,
  PHYSICAL_PERSON_REPOSITORY,
  ADDRESS_REPOSITORY,
  PHONE_REPOSITORY,
} from './physical-person.service';
import type { IPhysicalPersonRepository } from './interfaces/physical-person-repository.interface';
import type { IAddressRepository } from './interfaces/address-repository.interface';
import type { IPhoneRepository } from './interfaces/phone-repository.interface';
import type { Address, PhysicalPerson, Phone } from '@ged/database';

const mockPf = (overrides: Partial<PhysicalPerson> = {}): PhysicalPerson =>
  ({
    id: 'pf-1',
    userId: 'user-1',
    nome: 'João',
    sobrenome: 'Silva',
    cpf: '12345678901',
    dataNascimento: new Date('1990-01-01'),
    sexo: 'M' as const,
    addresses: [],
    phones: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as PhysicalPerson;

const mockAddress = (overrides: Partial<Address> = {}): Address =>
  ({
    id: 'addr-1',
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
  }) as Address;

describe('PhysicalPersonService', () => {
  let service: PhysicalPersonService;
  let mockPfRepository: jest.Mocked<IPhysicalPersonRepository>;
  let mockAddressRepository: jest.Mocked<IAddressRepository>;
  let mockPhoneRepository: jest.Mocked<IPhoneRepository>;

  beforeEach(async () => {
    mockPfRepository = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findByCpf: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    mockAddressRepository = {
      findByPhysicalPersonId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    mockPhoneRepository = {
      findByPhysicalPersonId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as jest.Mocked<IPhoneRepository>;

    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        PhysicalPersonService,
        { provide: PHYSICAL_PERSON_REPOSITORY, useValue: mockPfRepository },
        { provide: ADDRESS_REPOSITORY, useValue: mockAddressRepository },
        { provide: PHONE_REPOSITORY, useValue: mockPhoneRepository },
      ],
    }).compile();

    service = testModule.get<PhysicalPersonService>(PhysicalPersonService);
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

    it('should create physical person when data is valid', async () => {
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

  describe('removeAddress', () => {
    it('should throw NotFoundException when address belongs to a different user', async () => {
      const pf = mockPf({ id: 'pf-1' });
      const address = mockAddress({ pessoaFisicaId: 'pf-2' }); // belongs to another user
      mockPfRepository.findByUserId.mockResolvedValue(pf);
      mockAddressRepository.findById.mockResolvedValue(address);

      await expect(
        service.removeAddress('user-1', 'VIEWER', 'user-1', 'addr-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
