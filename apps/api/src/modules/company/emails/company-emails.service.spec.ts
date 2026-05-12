import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import type { Company, Email } from '@ged/database';
import {
  CompanyEmailsService,
  COMPANY_EMAIL_REPOSITORY,
} from './company-emails.service';
import type { ICompanyEmailRepository } from './interfaces/company-email-repository.interface';
import { CompanyService } from '../company.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

const mockEmail = (overrides: Partial<Email> = {}): Email =>
  ({
    id: 'email-1',
    companyId: 'company-1',
    pessoaFisicaId: null,
    tipo: 'PRINCIPAL',
    endereco: 'contato@empresa.com',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }) as unknown as Email;

describe('CompanyEmailsService', () => {
  let service: CompanyEmailsService;
  let repo: jest.Mocked<ICompanyEmailRepository>;
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
        CompanyEmailsService,
        { provide: COMPANY_EMAIL_REPOSITORY, useValue: repo },
        { provide: CompanyService, useValue: companyService },
        { provide: AuditLogsService, useValue: auditLogs },
      ],
    }).compile();

    service = moduleRef.get(CompanyEmailsService);
  });

  it('should list emails scoped to the singleton company', async () => {
    repo.findAllByCompany.mockResolvedValue([mockEmail()]);
    await expect(service.findAll()).resolves.toHaveLength(1);
    expect(repo.findAllByCompany).toHaveBeenCalledWith('company-1');
  });

  it('should create email and write audit log', async () => {
    repo.create.mockResolvedValue(mockEmail());
    await service.create('user-1', { tipo: 'PRINCIPAL', endereco: 'contato@empresa.com' });
    expect(repo.create).toHaveBeenCalled();
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'company.email.created' }),
    );
  });

  it('should throw NotFoundException when updating an email not owned by the company', async () => {
    repo.findByIdAndCompany.mockResolvedValue(null);
    await expect(
      service.update('user-1', 'email-x', { tipo: 'PRINCIPAL', endereco: 'x@y.com' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should delete email when found', async () => {
    repo.findByIdAndCompany.mockResolvedValue(mockEmail());
    await service.delete('user-1', 'email-1');
    expect(repo.delete).toHaveBeenCalledWith('email-1');
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'company.email.deleted' }),
    );
  });
});
