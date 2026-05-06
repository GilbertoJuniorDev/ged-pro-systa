import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Endereco } from '@ged/database';
import type {
  IEnderecoRepository,
  CreateEnderecoData,
  UpdateEnderecoData,
} from './interfaces/endereco-repository.interface';

@Injectable()
export class EnderecoRepository implements IEnderecoRepository {
  constructor(
    @InjectRepository(Endereco)
    private readonly repo: Repository<Endereco>,
  ) {}

  findByPessoaFisicaId(pessoaFisicaId: string): Promise<Endereco[]> {
    return this.repo.find({ where: { pessoaFisicaId }, order: { createdAt: 'ASC' } });
  }

  findById(id: string): Promise<Endereco | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: CreateEnderecoData): Promise<Endereco> {
    const endereco = this.repo.create(data);
    return this.repo.save(endereco);
  }

  async update(id: string, data: UpdateEnderecoData): Promise<Endereco> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
