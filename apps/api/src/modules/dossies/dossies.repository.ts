import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dossie } from '@ged/database';
import type {
  IDossieRepository,
  CreateDossieData,
  UpdateDossieData,
} from './interfaces/dossie-repository.interface';

@Injectable()
export class DossiesRepository implements IDossieRepository {
  constructor(
    @InjectRepository(Dossie)
    private readonly repo: Repository<Dossie>,
  ) {}

  findAll(filter?: { departamentoId?: string }): Promise<Dossie[]> {
    return this.repo.find({
      where: filter?.departamentoId ? { departamentoId: filter.departamentoId } : {},
      order: { nome: 'ASC' },
    });
  }

  findById(id: string): Promise<Dossie | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: CreateDossieData): Promise<Dossie> {
    const dossie = this.repo.create(data);
    return this.repo.save(dossie);
  }

  async update(id: string, data: UpdateDossieData): Promise<Dossie> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
