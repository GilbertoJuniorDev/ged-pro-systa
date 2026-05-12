import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Company } from '@ged/database';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type {
  ICompanyRepository,
  UpsertCompanyData,
} from './interfaces/company-repository.interface';

export const COMPANY_REPOSITORY = 'COMPANY_REPOSITORY';

@Injectable()
export class CompanyService {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getSingleton(): Promise<Company> {
    const company = await this.companyRepository.findSingleton();
    if (!company) throw new NotFoundException('Company not registered');
    return company;
  }

  findSingletonOrNull(): Promise<Company | null> {
    return this.companyRepository.findSingleton();
  }

  async upsert(
    requesterId: string,
    data: UpsertCompanyData,
  ): Promise<Company> {
    const existing = await this.companyRepository.findSingleton();

    if (!existing && (await this.cnpjConflictExists(data.cnpj))) {
      throw new ConflictException('CNPJ already registered');
    }

    const saved = await this.companyRepository.upsert(data);

    await this.auditLogsService.log({
      usuarioId: requesterId,
      acao: existing ? 'company.updated' : 'company.created',
      entidade: 'company',
      entidadeId: saved.id,
    });

    return saved;
  }

  private async cnpjConflictExists(_cnpj: string): Promise<boolean> {
    // Singleton: there is no other row to conflict with.
    // Mantido para clareza/extensibilidade futura.
    return false;
  }
}
