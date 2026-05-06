import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Modulo } from '@ged/database';
import type {
  IModuloRepository,
  CreateModuloData,
  UpdateModuloData,
} from './interfaces/modulo-repository.interface';

export const MODULO_REPOSITORY = 'MODULO_REPOSITORY';

@Injectable()
export class ModulosService {
  constructor(
    @Inject(MODULO_REPOSITORY)
    private readonly moduloRepository: IModuloRepository,
  ) {}

  findAll(): Promise<Modulo[]> {
    return this.moduloRepository.findAll();
  }

  async findById(id: string): Promise<Modulo> {
    const modulo = await this.moduloRepository.findById(id);
    if (!modulo) throw new NotFoundException('Módulo não encontrado');
    return modulo;
  }

  async create(data: CreateModuloData): Promise<Modulo> {
    const existingNome = await this.moduloRepository.findAll().then((list) =>
      list.find((m) => m.nome === data.nome),
    );
    if (existingNome) throw new ConflictException('Já existe um módulo com este nome');

    const existingSlug = await this.moduloRepository.findBySlug(data.slug);
    if (existingSlug) throw new ConflictException('Já existe um módulo com este slug');

    return this.moduloRepository.create(data);
  }

  async update(id: string, data: UpdateModuloData): Promise<Modulo> {
    await this.findById(id);

    if (data.slug) {
      const existing = await this.moduloRepository.findBySlug(data.slug);
      if (existing && existing.id !== id) {
        throw new ConflictException('Já existe um módulo com este slug');
      }
    }

    return this.moduloRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    return this.moduloRepository.remove(id);
  }
}
