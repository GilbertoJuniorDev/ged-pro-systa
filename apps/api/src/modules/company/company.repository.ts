import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '@ged/database';
import type {
  ICompanyRepository,
  UpsertCompanyData,
} from './interfaces/company-repository.interface';

@Injectable()
export class CompanyRepository implements ICompanyRepository {
  constructor(
    @InjectRepository(Company)
    private readonly repo: Repository<Company>,
  ) {}

  findSingleton(): Promise<Company | null> {
    return this.repo.findOne({ where: {} });
  }

  async upsert(data: UpsertCompanyData): Promise<Company> {
    const payload: Partial<Company> = {
      cnpj: data.cnpj,
      razaoSocial: data.razaoSocial,
      nomeFantasia: data.nomeFantasia ?? null,
      nomeEmpresarial: data.nomeEmpresarial ?? null,
      inscricaoEstadual: data.inscricaoEstadual ?? null,
      matriz: data.matriz ?? true,
      dataAbertura: toDate(data.dataAbertura),
      porte: data.porte ?? null,
      naturezaJuridicaCodigo: data.naturezaJuridicaCodigo ?? null,
      naturezaJuridicaDescricao: data.naturezaJuridicaDescricao ?? null,
      situacaoCadastral: data.situacaoCadastral ?? null,
      situacaoCadastralData: toDate(data.situacaoCadastralData),
    };

    const existing = await this.findSingleton();
    if (existing) {
      await this.repo.update(existing.id, payload as never);
      return this.repo.findOneOrFail({ where: { id: existing.id } });
    }
    const created = this.repo.create(payload);
    return this.repo.save(created);
  }
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  return new Date(value);
}
