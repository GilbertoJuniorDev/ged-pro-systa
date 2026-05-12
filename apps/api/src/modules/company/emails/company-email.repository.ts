import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Email } from '@ged/database';
import type {
  ICompanyEmailRepository,
  UpsertCompanyEmailData,
} from './interfaces/company-email-repository.interface';

@Injectable()
export class CompanyEmailRepository implements ICompanyEmailRepository {
  constructor(
    @InjectRepository(Email)
    private readonly repo: Repository<Email>,
  ) {}

  findAllByCompany(companyId: string): Promise<Email[]> {
    return this.repo.find({
      where: { companyId, pessoaFisicaId: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  findByIdAndCompany(id: string, companyId: string): Promise<Email | null> {
    return this.repo.findOne({
      where: { id, companyId, pessoaFisicaId: IsNull() },
    });
  }

  async create(companyId: string, data: UpsertCompanyEmailData): Promise<Email> {
    const created = this.repo.create({
      ...data,
      companyId,
      pessoaFisicaId: null,
    });
    return this.repo.save(created);
  }

  async update(id: string, data: UpsertCompanyEmailData): Promise<Email> {
    await this.repo.update({ id }, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
