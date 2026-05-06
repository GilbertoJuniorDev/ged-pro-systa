import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permissao } from '@ged/database';
import type {
  IPermissaoRepository,
  CreatePermissaoData,
  UpdatePermissaoData,
} from './interfaces/permissao-repository.interface';

@Injectable()
export class PermissoesRepository implements IPermissaoRepository {
  constructor(
    @InjectRepository(Permissao)
    private readonly repo: Repository<Permissao>,
  ) {}

  findAll(): Promise<Permissao[]> {
    return this.repo.find({
      relations: { modulo: true } as Record<string, boolean>,
      order: { nome: 'ASC' },
    });
  }

  findById(id: string): Promise<Permissao | null> {
    return this.repo.findOne({
      where: { id },
      relations: { modulo: true } as Record<string, boolean>,
    });
  }

  findByNome(nome: string): Promise<Permissao | null> {
    return this.repo.findOne({ where: { nome } });
  }

  async create(data: CreatePermissaoData): Promise<Permissao> {
    const permissao = this.repo.create(data);
    return this.repo.save(permissao);
  }

  async update(id: string, data: UpdatePermissaoData): Promise<Permissao> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
