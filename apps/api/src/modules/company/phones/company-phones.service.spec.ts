import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import type { Company, Phone } from '@ged/database';
import {
  CompanyPhonesService,
  COMPANY_PHONE_REPOSITORY,
} from './company-phones.service';
import type { ICompanyPhoneRepository } from './interfaces/company-phone-repository.interface';
import { CompanyService } from '../company.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

const mockPhone = (overrides: Partial<Phone> = {}): Phone =>
  ({
    id: 'phone-1',
    companyId: 'company-1',
    pessoaFisicaId: null,
    tipo: 'COMERCIAL',
    numero: '11999999999',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }) as unknown as Phone;

describe('CompanyPhonesService', () => {
  let service: CompanyPhonesService;
  let repo: jest.Mocked<ICompanyPhoneRepository>;
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
        CompanyPhonesService,
        { provide: COMPANY_PHONE_REPOSITORY, useValue: repo },
        { provide: CompanyService, useValue: companyService },
        { provide: AuditLogsService, useValue: auditLogs },
      ],
    }).compile();

    service = moduleRef.get(CompanyPhonesService);
  });

  it('should list phones scoped to the singleton company', async () => {
    repo.findAllByCompany.mockResolvedValue([mockPhone()]);
    await expect(service.findAll()).resolves.toHaveLength(1);
    expect(repo.findAllByCompany).toHaveBeenCalledWith('company-1');
  });

  it('should create phone and write audit log', async () => {
    repo.create.mockResolvedValue(mockPhone());
    await service.create('user-1', { tipo: 'COMERCIAL', numero: '11999999999' });
    expect(repo.create).toHaveBeenCalled();
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'company.phone.created' }),
    );
  });

  it('should throw NotFoundException when updating a phone not owned by the company', async () => {
    repo.findByIdAndCompany.mockResolvedValue(null);
    await expect(
      service.update('user-1', 'phone-x', { tipo: 'COMERCIAL', numero: '00000000' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should delete phone when found', async () => {
    repo.findByIdAndCompany.mockResolvedValue(mockPhone());
    await service.delete('user-1', 'phone-1');
    expect(repo.delete).toHaveBeenCalledWith('phone-1');
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'company.phone.deleted' }),
    );
  });
});
