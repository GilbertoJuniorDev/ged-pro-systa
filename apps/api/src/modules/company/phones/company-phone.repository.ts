import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Phone } from '@ged/database';
import type {
  ICompanyPhoneRepository,
  UpsertCompanyPhoneData,
} from './interfaces/company-phone-repository.interface';

@Injectable()
export class CompanyPhoneRepository implements ICompanyPhoneRepository {
  constructor(
    @InjectRepository(Phone)
    private readonly repo: Repository<Phone>,
  ) {}

  findAllByCompany(companyId: string): Promise<Phone[]> {
    return this.repo.find({
      where: { companyId, pessoaFisicaId: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  findByIdAndCompany(id: string, companyId: string): Promise<Phone | null> {
    return this.repo.findOne({
      where: { id, companyId, pessoaFisicaId: IsNull() },
    });
  }

  async create(companyId: string, data: UpsertCompanyPhoneData): Promise<Phone> {
    const created = this.repo.create({
      ...data,
      companyId,
      pessoaFisicaId: null,
    });
    return this.repo.save(created);
  }

  async update(id: string, data: UpsertCompanyPhoneData): Promise<Phone> {
    await this.repo.update({ id }, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
