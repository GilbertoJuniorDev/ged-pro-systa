import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Cnae } from '@ged/database';
import { CompanyService } from '../company.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { CompanyCnaeRepository } from './company-cnae.repository';
import type {
  ICompanyCnaeRepository,
  UpsertCompanyCnaeData,
} from './interfaces/company-cnae-repository.interface';

export const COMPANY_CNAE_REPOSITORY = 'COMPANY_CNAE_REPOSITORY';

@Injectable()
export class CompanyCnaesService {
  constructor(
    @Inject(COMPANY_CNAE_REPOSITORY)
    private readonly repository: ICompanyCnaeRepository,
    private readonly companyService: CompanyService,
    private readonly auditLogsService: AuditLogsService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<Cnae[]> {
    const company = await this.companyService.getSingleton();
    return this.repository.findAllByCompany(company.id);
  }

  async create(requesterId: string, data: UpsertCompanyCnaeData): Promise<Cnae> {
    const company = await this.companyService.getSingleton();

    const duplicate = await this.repository.findByCodigoAndCompany(data.codigo, company.id);
    if (duplicate) throw new ConflictException('CNAE já cadastrado para a empresa');

    const created = await this.dataSource.transaction(async () => {
      if (data.principal) {
        await this.repository.unsetPrincipal(company.id);
      }
      return this.repository.create(company.id, data);
    });

    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'company.cnae.created',
      entidade: 'cnae',
      entidadeId: created.id,
    });
    return created;
  }

  async update(
    requesterId: string,
    id: string,
    data: UpsertCompanyCnaeData,
  ): Promise<Cnae> {
    const company = await this.companyService.getSingleton();
    const existing = await this.repository.findByIdAndCompany(id, company.id);
    if (!existing) throw new NotFoundException('CNAE não encontrado');

    if (data.codigo !== existing.codigo) {
      const duplicate = await this.repository.findByCodigoAndCompany(data.codigo, company.id);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('CNAE já cadastrado para a empresa');
      }
    }

    const updated = await this.dataSource.transaction(async () => {
      if (data.principal) {
        await this.repository.unsetPrincipal(company.id, id);
      }
      return this.repository.update(id, data);
    });

    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'company.cnae.updated',
      entidade: 'cnae',
      entidadeId: updated.id,
    });
    return updated;
  }

  async delete(requesterId: string, id: string): Promise<void> {
    const company = await this.companyService.getSingleton();
    const existing = await this.repository.findByIdAndCompany(id, company.id);
    if (!existing) throw new NotFoundException('CNAE não encontrado');

    await this.repository.delete(id);
    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'company.cnae.deleted',
      entidade: 'cnae',
      entidadeId: id,
    });
  }
}

// re-export to allow easy mocking on tests
export { CompanyCnaeRepository };
