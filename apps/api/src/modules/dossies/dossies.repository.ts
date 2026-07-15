import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, type FindOptionsWhere } from 'typeorm';
import { Dossie } from '@ged/database';
import type {
  IDossieRepository,
  DossieQueryFilter,
  CreateDossieData,
  UpdateDossieData,
} from './interfaces/dossie-repository.interface';

@Injectable()
export class DossiesRepository implements IDossieRepository {
  constructor(
    @InjectRepository(Dossie)
    private readonly repo: Repository<Dossie>,
  ) {}

  findAll(filter?: DossieQueryFilter): Promise<Dossie[]> {
    const where: FindOptionsWhere<Dossie> = {};
    if (filter?.departamentoId) {
      where.departamentoId = filter.departamentoId;
    } else if (filter?.allowedDepartamentoIds) {
      where.departamentoId = In([...filter.allowedDepartamentoIds]);
    }
    return this.repo.find({ where, order: { nome: 'ASC' } });
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
