import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Email } from '@ged/database';
import { CompanyService } from '../company.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import type {
  ICompanyEmailRepository,
  UpsertCompanyEmailData,
} from './interfaces/company-email-repository.interface';

export const COMPANY_EMAIL_REPOSITORY = 'COMPANY_EMAIL_REPOSITORY';

@Injectable()
export class CompanyEmailsService {
  constructor(
    @Inject(COMPANY_EMAIL_REPOSITORY)
    private readonly repository: ICompanyEmailRepository,
    private readonly companyService: CompanyService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(): Promise<Email[]> {
    const company = await this.companyService.getSingleton();
    return this.repository.findAllByCompany(company.id);
  }

  async create(requesterId: string, data: UpsertCompanyEmailData): Promise<Email> {
    const company = await this.companyService.getSingleton();
    const created = await this.repository.create(company.id, data);
    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'company.email.created',
      entidade: 'email',
      entidadeId: created.id,
    });
    return created;
  }

  async update(
    requesterId: string,
    id: string,
    data: UpsertCompanyEmailData,
  ): Promise<Email> {
    const company = await this.companyService.getSingleton();
    const existing = await this.repository.findByIdAndCompany(id, company.id);
    if (!existing) throw new NotFoundException('E-mail não encontrado');

    const updated = await this.repository.update(id, data);
    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'company.email.updated',
      entidade: 'email',
      entidadeId: updated.id,
    });
    return updated;
  }

  async delete(requesterId: string, id: string): Promise<void> {
    const company = await this.companyService.getSingleton();
    const existing = await this.repository.findByIdAndCompany(id, company.id);
    if (!existing) throw new NotFoundException('E-mail não encontrado');

    await this.repository.delete(id);
    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: 'company.email.deleted',
      entidade: 'email',
      entidadeId: id,
    });
  }
}
