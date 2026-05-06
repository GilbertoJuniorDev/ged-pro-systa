import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Modulo } from '@ged/database';
import type {
  IModuloRepository,
  CreateModuloData,
  UpdateModuloData,
} from './interfaces/modulo-repository.interface';

@Injectable()
export class ModulosRepository implements IModuloRepository {
  constructor(
    @InjectRepository(Modulo)
    private readonly repo: Repository<Modulo>,
  ) {}

  findAll(): Promise<Modulo[]> {
    return this.repo.find({ order: { ordem: 'ASC', nome: 'ASC' } });
  }

  findById(id: string): Promise<Modulo | null> {
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(slug: string): Promise<Modulo | null> {
    return this.repo.findOne({ where: { slug } });
  }

  async create(data: CreateModuloData): Promise<Modulo> {
    const modulo = this.repo.create(data);
    return this.repo.save(modulo);
  }

  async update(id: string, data: UpdateModuloData): Promise<Modulo> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
