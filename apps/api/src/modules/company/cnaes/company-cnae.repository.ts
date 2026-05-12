import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Cnae } from '@ged/database';
import type {
  ICompanyCnaeRepository,
  UpsertCompanyCnaeData,
} from './interfaces/company-cnae-repository.interface';

@Injectable()
export class CompanyCnaeRepository implements ICompanyCnaeRepository {
  constructor(
    @InjectRepository(Cnae)
    private readonly repo: Repository<Cnae>,
  ) {}

  findAllByCompany(companyId: string): Promise<Cnae[]> {
    return this.repo.find({
      where: { companyId },
      order: { principal: 'DESC', codigo: 'ASC' },
    });
  }

  findByIdAndCompany(id: string, companyId: string): Promise<Cnae | null> {
    return this.repo.findOne({ where: { id, companyId } });
  }

  findByCodigoAndCompany(codigo: string, companyId: string): Promise<Cnae | null> {
    return this.repo.findOne({ where: { codigo, companyId } });
  }

  async create(companyId: string, data: UpsertCompanyCnaeData): Promise<Cnae> {
    const created = this.repo.create({
      companyId,
      codigo: data.codigo,
      descricao: data.descricao,
      principal: data.principal ?? false,
    });
    return this.repo.save(created);
  }

  async update(id: string, data: UpsertCompanyCnaeData): Promise<Cnae> {
    await this.repo.update(
      { id },
      {
        codigo: data.codigo,
        descricao: data.descricao,
        principal: data.principal ?? false,
      },
    );
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async unsetPrincipal(companyId: string, exceptId?: string): Promise<void> {
    const where = exceptId
      ? { companyId, principal: true, id: Not(exceptId) }
      : { companyId, principal: true };
    await this.repo.update(where, { principal: false });
  }
}
