import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Module as ModuleEntity } from '@ged/database';
import type {
  IModuleRepository,
  CreateModuleData,
  UpdateModuleData,
} from './interfaces/module-repository.interface';

export const MODULE_REPOSITORY = 'MODULE_REPOSITORY';

@Injectable()
export class ModulesService {
  constructor(
    @Inject(MODULE_REPOSITORY)
    private readonly moduleRepository: IModuleRepository,
  ) {}

  findAll(): Promise<ModuleEntity[]> {
    return this.moduleRepository.findAll();
  }

  async findById(id: string): Promise<ModuleEntity> {
    const module = await this.moduleRepository.findById(id);
    if (!module) throw new NotFoundException('Module not found');
    return module;
  }

  async create(data: CreateModuleData): Promise<ModuleEntity> {
    const existingNome = await this.moduleRepository.findAll().then((list) =>
      list.find((m) => m.nome === data.nome),
    );
    if (existingNome) throw new ConflictException('A module with this name already exists');

    const existingSlug = await this.moduleRepository.findBySlug(data.slug);
    if (existingSlug) throw new ConflictException('A module with this slug already exists');

    return this.moduleRepository.create(data);
  }

  async update(id: string, data: UpdateModuleData): Promise<ModuleEntity> {
    await this.findById(id);

    if (data.slug) {
      const existing = await this.moduleRepository.findBySlug(data.slug);
      if (existing && existing.id !== id) {
        throw new ConflictException('A module with this slug already exists');
      }
    }

    return this.moduleRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    return this.moduleRepository.remove(id);
  }
}
