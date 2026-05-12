import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import type { Company } from '@ged/database';
import { CompanyService, COMPANY_REPOSITORY } from './company.service';
import type { ICompanyRepository } from './interfaces/company-repository.interface';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

const mockCompany = (overrides: Partial<Company> = {}): Company =>
  ({
    id: 'company-1',
    cnpj: '12345678000190',
    razaoSocial: 'Acme Ltda',
    nomeFantasia: null,
    nomeEmpresarial: null,
    inscricaoEstadual: null,
    matriz: true,
    dataAbertura: null,
    porte: null,
    naturezaJuridicaCodigo: null,
    naturezaJuridicaDescricao: null,
    situacaoCadastral: null,
    situacaoCadastralData: null,
    singleton: 'X',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as unknown as Company;

describe('CompanyService', () => {
  let service: CompanyService;
  let repo: jest.Mocked<ICompanyRepository>;
  let auditLogs: jest.Mocked<Pick<AuditLogsService, 'log'>>;

  beforeEach(async () => {
    repo = {
      findSingleton: jest.fn(),
      upsert: jest.fn(),
    };
    auditLogs = { log: jest.fn().mockResolvedValue(undefined) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        { provide: COMPANY_REPOSITORY, useValue: repo },
        { provide: AuditLogsService, useValue: auditLogs },
      ],
    }).compile();

    service = moduleRef.get<CompanyService>(CompanyService);
  });

  describe('getSingleton', () => {
    it('should throw NotFoundException when company does not exist', async () => {
      repo.findSingleton.mockResolvedValue(null);
      await expect(service.getSingleton()).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should return company when it exists', async () => {
      const c = mockCompany();
      repo.findSingleton.mockResolvedValue(c);
      await expect(service.getSingleton()).resolves.toBe(c);
    });
  });

  describe('upsert', () => {
    const data = {
      cnpj: '12345678000190',
      razaoSocial: 'Acme Ltda',
    };

    it('should create with audit log "company.created" when no record exists', async () => {
      repo.findSingleton.mockResolvedValue(null);
      const created = mockCompany();
      repo.upsert.mockResolvedValue(created);

      const result = await service.upsert('user-1', data);

      expect(repo.upsert).toHaveBeenCalledWith(data);
      expect(auditLogs.log).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'user-1',
          acao: 'company.created',
          entidade: 'company',
          entidadeId: 'company-1',
        }),
      );
      expect(result).toBe(created);
    });

    it('should update with audit log "company.updated" when record exists', async () => {
      const existing = mockCompany();
      repo.findSingleton.mockResolvedValue(existing);
      const updated = mockCompany({ razaoSocial: 'New Name' });
      repo.upsert.mockResolvedValue(updated);

      const result = await service.upsert('user-1', { ...data, razaoSocial: 'New Name' });

      expect(auditLogs.log).toHaveBeenCalledWith(
        expect.objectContaining({ acao: 'company.updated' }),
      );
      expect(result).toBe(updated);
    });
  });
});
