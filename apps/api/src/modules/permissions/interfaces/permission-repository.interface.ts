import type { Permission } from '@ged/database';

export interface CreatePermissionData {
  readonly nome: string;
  readonly descricao?: string | null;
  readonly moduloId?: string | null;
}

export interface UpdatePermissionData {
  readonly nome?: string;
  readonly descricao?: string | null;
  readonly moduloId?: string | null;
}

export interface IPermissionRepository {
  findAll(): Promise<Permission[]>;
  findById(id: string): Promise<Permission | null>;
  findByNome(nome: string): Promise<Permission | null>;
  create(data: CreatePermissionData): Promise<Permission>;
  update(id: string, data: UpdatePermissionData): Promise<Permission>;
  remove(id: string): Promise<void>;
}
