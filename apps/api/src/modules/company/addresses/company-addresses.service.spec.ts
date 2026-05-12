import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import type { Address, Company } from '@ged/database';
import {
  CompanyAddressesService,
  COMPANY_ADDRESS_REPOSITORY,
} from './company-addresses.service';
import type { ICompanyAddressRepository } from './interfaces/company-address-repository.interface';
import { CompanyService } from '../company.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

const mockAddress = (overrides: Partial<Address> = {}): Address =>
  ({
    id: 'addr-1',
    companyId: 'company-1',
    pessoaFisicaId: null,
    tipo: 'COMERCIAL',
    logradouro: 'Rua A',
    numero: '100',
    complemento: null,
    bairro: 'Centro',
    cidade: 'SP',
    estado: 'SP',
    cep: '01010000',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }) as unknown as Address;

describe('CompanyAddressesService', () => {
  let service: CompanyAddressesService;
  let repo: jest.Mocked<ICompanyAddressRepository>;
  let companyService: jest.Mocked<Pick<CompanyService, 'getSingleton'>>;
  let auditLogs: jest.Mocked<Pick<AuditLogsService, 'log'>>;

  beforeEach(async () => {
    repo = {
      findAllByCompany: jest.fn(),
      findByIdAndCompany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    companyService = { getSingleton: jest.fn().mockResolvedValue({ id: 'company-1' } as Company) };
    auditLogs = { log: jest.fn().mockResolvedValue(undefined) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyAddressesService,
        { provide: COMPANY_ADDRESS_REPOSITORY, useValue: repo },
        { provide: CompanyService, useValue: companyService },
        { provide: AuditLogsService, useValue: auditLogs },
      ],
    }).compile();

    service = moduleRef.get(CompanyAddressesService);
  });

  it('should list addresses scoped to the singleton company', async () => {
    repo.findAllByCompany.mockResolvedValue([mockAddress()]);
    const list = await service.findAll();
    expect(list).toHaveLength(1);
    expect(repo.findAllByCompany).toHaveBeenCalledWith('company-1');
  });

  it('should create address and write audit log', async () => {
    const created = mockAddress();
    repo.create.mockResolvedValue(created);
    await service.create('user-1', {
      tipo: 'COMERCIAL',
      logradouro: 'Rua A',
      numero: '100',
      bairro: 'Centro',
      cidade: 'SP',
      estado: 'SP',
      cep: '01010000',
    });
    expect(repo.create).toHaveBeenCalled();
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'company.address.created' }),
    );
  });

  it('should throw NotFoundException when updating an address not owned by the company', async () => {
    repo.findByIdAndCompany.mockResolvedValue(null);
    await expect(
      service.update('user-1', 'addr-x', {
        tipo: 'COMERCIAL',
        logradouro: 'x',
        numero: '1',
        bairro: 'x',
        cidade: 'x',
        estado: 'SP',
        cep: '00000000',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should delete address and audit when it belongs to the company', async () => {
    repo.findByIdAndCompany.mockResolvedValue(mockAddress());
    await service.delete('user-1', 'addr-1');
    expect(repo.delete).toHaveBeenCalledWith('addr-1');
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'company.address.deleted' }),
    );
  });
});
