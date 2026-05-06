import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Telefone } from '@ged/database';
import type {
  ITelefoneRepository,
  CreateTelefoneData,
  UpdateTelefoneData,
} from './interfaces/telefone-repository.interface';

@Injectable()
export class TelefoneRepository implements ITelefoneRepository {
  constructor(
    @InjectRepository(Telefone)
    private readonly repo: Repository<Telefone>,
  ) {}

  findByPessoaFisicaId(pessoaFisicaId: string): Promise<Telefone[]> {
    return this.repo.find({ where: { pessoaFisicaId }, order: { createdAt: 'ASC' } });
  }

  findById(id: string): Promise<Telefone | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: CreateTelefoneData): Promise<Telefone> {
    const telefone = this.repo.create(data);
    return this.repo.save(telefone);
  }

  async update(id: string, data: UpdateTelefoneData): Promise<Telefone> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
