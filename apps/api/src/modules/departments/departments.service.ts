import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Department } from '@ged/database';
import type {
  IDepartmentRepository,
  CreateDepartmentData,
  UpdateDepartmentData,
} from './interfaces/department-repository.interface';

export const DEPARTMENT_REPOSITORY = 'DEPARTMENT_REPOSITORY';

@Injectable()
export class DepartmentsService {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: IDepartmentRepository,
  ) {}

  findAll(): Promise<Department[]> {
    return this.departmentRepository.findAll();
  }

  findAllActive(): Promise<Department[]> {
    return this.departmentRepository.findAllActive();
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepository.findById(id);
    if (!department) throw new NotFoundException('Departamento não encontrado');
    return department;
  }

  async create(data: CreateDepartmentData): Promise<Department> {
    const existing = await this.departmentRepository.findByName(data.nome);
    if (existing) {
      throw new ConflictException('Já existe um departamento com este nome');
    }

    return this.departmentRepository.create(data);
  }

  async update(id: string, data: UpdateDepartmentData): Promise<Department> {
    await this.findOne(id);

    if (data.nome) {
      const existing = await this.departmentRepository.findByName(data.nome);
      if (existing && existing.id !== id) {
        throw new ConflictException('Já existe um departamento com este nome');
      }
    }

    return this.departmentRepository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    return this.departmentRepository.delete(id);
  }
}
