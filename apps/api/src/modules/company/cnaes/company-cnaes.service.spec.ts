import { Test, type TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Cnae, Company } from '@ged/database';
import { CompanyCnaesService, COMPANY_CNAE_REPOSITORY } from './company-cnaes.service';
import type { ICompanyCnaeRepository } from './interfaces/company-cnae-repository.interface';
import { CompanyService } from '../company.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

const mockCnae = (overrides: Partial<Cnae> = {}): Cnae =>
  ({
    id: 'cnae-1',
    companyId: 'company-1',
    codigo: '6201500',
    descricao: 'Desenvolvimento de software sob encomenda',
    principal: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }) as unknown as Cnae;

const company = { id: 'company-1' } as Company;

describe('CompanyCnaesService', () => {
  let service: CompanyCnaesService;
  let repo: jest.Mocked<ICompanyCnaeRepository>;
  let companyService: jest.Mocked<Pick<CompanyService, 'getSingleton'>>;
  let auditLogs: jest.Mocked<Pick<AuditLogsService, 'log'>>;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    repo = {
      findAllByCompany: jest.fn(),
      findByIdAndCompany: jest.fn(),
      findByCodigoAndCompany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      unsetPrincipal: jest.fn(),
    };
    companyService = { getSingleton: jest.fn().mockResolvedValue(company) };
    auditLogs = { log: jest.fn().mockResolvedValue(undefined) };
    dataSource = { transaction: jest.fn(async (fn: () => Promise<unknown>) => fn()) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyCnaesService,
        { provide: COMPANY_CNAE_REPOSITORY, useValue: repo },
        { provide: CompanyService, useValue: companyService },
        { provide: AuditLogsService, useValue: auditLogs },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = moduleRef.get(CompanyCnaesService);
  });

  describe('findAll', () => {
    it('should return cnaes for the singleton company', async () => {
      const list = [mockCnae()];
      repo.findAllByCompany.mockResolvedValue(list);
      await expect(service.findAll()).resolves.toBe(list);
      expect(repo.findAllByCompany).toHaveBeenCalledWith('company-1');
    });
  });

  describe('create', () => {
    it('should throw ConflictException when codigo already exists', async () => {
      repo.findByCodigoAndCompany.mockResolvedValue(mockCnae());
      await expect(
        service.create('user-1', { codigo: '6201500', descricao: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('should create cnae without touching unsetPrincipal when principal is false', async () => {
      repo.findByCodigoAndCompany.mockResolvedValue(null);
      const created = mockCnae();
      repo.create.mockResolvedValue(created);

      await service.create('user-1', { codigo: '6201500', descricao: 'x', principal: false });

      expect(repo.unsetPrincipal).not.toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalledWith('company-1', { codigo: '6201500', descricao: 'x', principal: false });
      expect(auditLogs.log).toHaveBeenCalledWith(expect.objectContaining({ acao: 'company.cnae.created' }));
    });

    it('should unset previous principal before creating when principal is true', async () => {
      repo.findByCodigoAndCompany.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockCnae({ principal: true }));

      await service.create('user-1', { codigo: '6201500', descricao: 'x', principal: true });

      expect(repo.unsetPrincipal).toHaveBeenCalledWith('company-1');
      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should throw NotFoundException when cnae does not belong to the company', async () => {
      repo.findByIdAndCompany.mockResolvedValue(null);
      await expect(
        service.update('user-1', 'cnae-x', { codigo: '6201500', descricao: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should unset principal in others when marking this one principal', async () => {
      repo.findByIdAndCompany.mockResolvedValue(mockCnae());
      repo.findByCodigoAndCompany.mockResolvedValue(null);
      repo.update.mockResolvedValue(mockCnae({ principal: true }));

      await service.update('user-1', 'cnae-1', {
        codigo: '6201500',
        descricao: 'updated',
        principal: true,
      });

      expect(repo.unsetPrincipal).toHaveBeenCalledWith('company-1', 'cnae-1');
      expect(repo.update).toHaveBeenCalled();
    });

    it('should throw ConflictException when new codigo collides with another row', async () => {
      repo.findByIdAndCompany.mockResolvedValue(mockCnae({ codigo: '6201501' }));
      repo.findByCodigoAndCompany.mockResolvedValue(mockCnae({ id: 'cnae-2', codigo: '6201500' }));
      await expect(
        service.update('user-1', 'cnae-1', { codigo: '6201500', descricao: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException when cnae not found', async () => {
      repo.findByIdAndCompany.mockResolvedValue(null);
      await expect(service.delete('user-1', 'cnae-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should delete and audit when cnae exists', async () => {
      repo.findByIdAndCompany.mockResolvedValue(mockCnae());
      await service.delete('user-1', 'cnae-1');
      expect(repo.delete).toHaveBeenCalledWith('cnae-1');
      expect(auditLogs.log).toHaveBeenCalledWith(expect.objectContaining({ acao: 'company.cnae.deleted' }));
    });
  });
});
