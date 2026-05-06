import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PessoaFisica } from '@ged/database';
import type {
  IPessoaFisicaRepository,
  CreatePessoaFisicaData,
  UpdatePessoaFisicaData,
} from './interfaces/pessoa-fisica-repository.interface';

@Injectable()
export class PessoaFisicaRepository implements IPessoaFisicaRepository {
  constructor(
    @InjectRepository(PessoaFisica)
    private readonly repo: Repository<PessoaFisica>,
  ) {}

  findByUserId(userId: string): Promise<PessoaFisica | null> {
    return this.repo.findOne({ where: { userId } });
  }

  findById(id: string): Promise<PessoaFisica | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByCpf(cpf: string): Promise<PessoaFisica | null> {
    return this.repo.findOne({ where: { cpf } });
  }

  async create(data: CreatePessoaFisicaData): Promise<PessoaFisica> {
    const pf = this.repo.create(data);
    return this.repo.save(pf);
  }

  async update(id: string, data: UpdatePessoaFisicaData): Promise<PessoaFisica> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }
}
