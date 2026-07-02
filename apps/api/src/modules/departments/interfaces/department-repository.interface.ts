import type { Department } from '@ged/database';

export interface CreateDepartmentData {
  readonly nome: string;
  readonly descricao?: string | null;
}

export interface UpdateDepartmentData {
  readonly nome?: string;
  readonly descricao?: string | null;
  readonly isActive?: boolean;
}

export interface IDepartmentRepository {
  findAll(): Promise<Department[]>;
  findAllActive(): Promise<Department[]>;
  findById(id: string): Promise<Department | null>;
  findByName(nome: string): Promise<Department | null>;
  create(data: CreateDepartmentData): Promise<Department>;
  update(id: string, data: UpdateDepartmentData): Promise<Department>;
  delete(id: string): Promise<void>;
}
