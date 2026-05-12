import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Address } from '@ged/database';
import { CompanyService } from '../company.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import type {
  ICompanyAddressRepository,
  UpsertCompanyAddressData,
} from './interfaces/company-address-repository.interface';

export const COMPANY_ADDRESS_REPOSITORY = 'COMPANY_ADDRESS_REPOSITORY';

@Injectable()
export class CompanyAddressesService {
  constructor(
    @Inject(COMPANY_ADDRESS_REPOSITORY)
    private readonly repository: ICompanyAddressRepository,
    private readonly companyService: CompanyService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(): Promise<Address[]> {
    const company = await this.companyService.getSingleton();
    return this.repository.findAllByCompany(company.id);
  }

  async create(requesterId: string, data: UpsertCompanyAddressData): Promise<Address> {
    const company = await this.companyService.getSingleton();
    const created = await this.repository.create(company.id, data);
    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'company.address.created',
      entidade: 'address',
      entidadeId: created.id,
    });
    return created;
  }

  async update(
    requesterId: string,
    id: string,
    data: UpsertCompanyAddressData,
  ): Promise<Address> {
    const company = await this.companyService.getSingleton();
    const existing = await this.repository.findByIdAndCompany(id, company.id);
    if (!existing) throw new NotFoundException('Endereço não encontrado');

    const updated = await this.repository.update(id, data);
    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'company.address.updated',
      entidade: 'address',
      entidadeId: updated.id,
    });
    return updated;
  }

  async delete(requesterId: string, id: string): Promise<void> {
    const company = await this.companyService.getSingleton();
    const existing = await this.repository.findByIdAndCompany(id, company.id);
    if (!existing) throw new NotFoundException('Endereço não encontrado');

    await this.repository.delete(id);
    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'company.address.deleted',
      entidade: 'address',
      entidadeId: id,
    });
  }
}
