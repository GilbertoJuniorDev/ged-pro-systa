import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Address } from '@ged/database';
import type {
  ICompanyAddressRepository,
  UpsertCompanyAddressData,
} from './interfaces/company-address-repository.interface';

@Injectable()
export class CompanyAddressRepository implements ICompanyAddressRepository {
  constructor(
    @InjectRepository(Address)
    private readonly repo: Repository<Address>,
  ) {}

  findAllByCompany(companyId: string): Promise<Address[]> {
    return this.repo.find({
      where: { companyId, pessoaFisicaId: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  findByIdAndCompany(id: string, companyId: string): Promise<Address | null> {
    return this.repo.findOne({
      where: { id, companyId, pessoaFisicaId: IsNull() },
    });
  }

  async create(companyId: string, data: UpsertCompanyAddressData): Promise<Address> {
    const created = this.repo.create({
      ...data,
      complemento: data.complemento ?? null,
      companyId,
      pessoaFisicaId: null,
    });
    return this.repo.save(created);
  }

  async update(id: string, data: UpsertCompanyAddressData): Promise<Address> {
    await this.repo.update(
      { id, companyId: Not(IsNull()) },
      { ...data, complemento: data.complemento ?? null },
    );
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
