import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '@ged/database';
import type {
  IDepartmentRepository,
  CreateDepartmentData,
  UpdateDepartmentData,
} from './interfaces/department-repository.interface';

@Injectable()
export class DepartmentsRepository implements IDepartmentRepository {
  constructor(
    @InjectRepository(Department)
    private readonly repo: Repository<Department>,
  ) {}

  findAll(): Promise<Department[]> {
    return this.repo.find({ order: { nome: 'ASC' } });
  }

  findAllActive(): Promise<Department[]> {
    return this.repo.find({ where: { isActive: true }, order: { nome: 'ASC' } });
  }

  findById(id: string): Promise<Department | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByName(nome: string): Promise<Department | null> {
    return this.repo.findOne({ where: { nome } });
  }

  async create(data: CreateDepartmentData): Promise<Department> {
    const department = this.repo.create(data);
    return this.repo.save(department);
  }

  async update(id: string, data: UpdateDepartmentData): Promise<Department> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
