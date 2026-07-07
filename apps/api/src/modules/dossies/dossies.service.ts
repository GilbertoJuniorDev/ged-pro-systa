import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Dossie } from '@ged/database';
import { Department } from '@ged/database';
import type {
  IDossieRepository,
  CreateDossieData,
  UpdateDossieData,
} from './interfaces/dossie-repository.interface';

export const DOSSIE_REPOSITORY = 'DOSSIE_REPOSITORY';

@Injectable()
export class DossiesService {
  constructor(
    @Inject(DOSSIE_REPOSITORY)
    private readonly dossieRepository: IDossieRepository,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  findAll(departamentoId?: string): Promise<Dossie[]> {
    return this.dossieRepository.findAll({ departamentoId });
  }

  async findOne(id: string): Promise<Dossie> {
    const dossie = await this.dossieRepository.findById(id);
    if (!dossie) throw new NotFoundException('Dossiê não encontrado');
    return dossie;
  }

  async create(data: CreateDossieData): Promise<Dossie> {
    const department = await this.departmentRepository.findOne({
      where: { id: data.departamentoId },
    });
    if (!department) {
      throw new BadRequestException('Departamento não encontrado');
    }

    return this.dossieRepository.create(data);
  }

  async update(id: string, data: UpdateDossieData): Promise<Dossie> {
    await this.findOne(id);
    return this.dossieRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    return this.dossieRepository.delete(id);
  }
}
