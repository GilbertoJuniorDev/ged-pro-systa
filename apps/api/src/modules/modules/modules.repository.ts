import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module as ModuleEntity } from '@ged/database';
import type {
  IModuleRepository,
  CreateModuleData,
  UpdateModuleData,
} from './interfaces/module-repository.interface';

@Injectable()
export class ModulesRepository implements IModuleRepository {
  constructor(
    @InjectRepository(ModuleEntity)
    private readonly repo: Repository<ModuleEntity>,
  ) {}

  findAll(): Promise<ModuleEntity[]> {
    return this.repo.find({ order: { ordem: 'ASC', nome: 'ASC' } });
  }

  findById(id: string): Promise<ModuleEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(slug: string): Promise<ModuleEntity | null> {
    return this.repo.findOne({ where: { slug } });
  }

  async create(data: CreateModuleData): Promise<ModuleEntity> {
    const module = this.repo.create(data);
    return this.repo.save(module);
  }

  async update(id: string, data: UpdateModuleData): Promise<ModuleEntity> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
