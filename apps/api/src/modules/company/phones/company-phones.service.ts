import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Phone } from '@ged/database';
import { CompanyService } from '../company.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import type {
  ICompanyPhoneRepository,
  UpsertCompanyPhoneData,
} from './interfaces/company-phone-repository.interface';

export const COMPANY_PHONE_REPOSITORY = 'COMPANY_PHONE_REPOSITORY';

@Injectable()
export class CompanyPhonesService {
  constructor(
    @Inject(COMPANY_PHONE_REPOSITORY)
    private readonly repository: ICompanyPhoneRepository,
    private readonly companyService: CompanyService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(): Promise<Phone[]> {
    const company = await this.companyService.getSingleton();
    return this.repository.findAllByCompany(company.id);
  }

  async create(requesterId: string, data: UpsertCompanyPhoneData): Promise<Phone> {
    const company = await this.companyService.getSingleton();
    const created = await this.repository.create(company.id, data);
    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'company.phone.created',
      entidade: 'phone',
      entidadeId: created.id,
    });
    return created;
  }

  async update(
    requesterId: string,
    id: string,
    data: UpsertCompanyPhoneData,
  ): Promise<Phone> {
    const company = await this.companyService.getSingleton();
    const existing = await this.repository.findByIdAndCompany(id, company.id);
    if (!existing) throw new NotFoundException('Telefone não encontrado');

    const updated = await this.repository.update(id, data);
    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'company.phone.updated',
      entidade: 'phone',
      entidadeId: updated.id,
    });
    return updated;
  }

  async delete(requesterId: string, id: string): Promise<void> {
    const company = await this.companyService.getSingleton();
    const existing = await this.repository.findByIdAndCompany(id, company.id);
    if (!existing) throw new NotFoundException('Telefone não encontrado');

    await this.repository.delete(id);
    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'company.phone.deleted',
      entidade: 'phone',
      entidadeId: id,
    });
  }
}
