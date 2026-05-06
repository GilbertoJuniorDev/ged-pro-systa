import type { Module } from '@ged/database';

export interface CreateModuleData {
  readonly nome: string;
  readonly slug: string;
  readonly descricao?: string | null;
  readonly icone?: string | null;
  readonly ordem?: number;
}

export interface UpdateModuleData {
  readonly nome?: string;
  readonly slug?: string;
  readonly descricao?: string | null;
  readonly icone?: string | null;
  readonly ordem?: number;
  readonly isActive?: boolean;
}

export interface IModuleRepository {
  findAll(): Promise<Module[]>;
  findById(id: string): Promise<Module | null>;
  findBySlug(slug: string): Promise<Module | null>;
  create(data: CreateModuleData): Promise<Module>;
  update(id: string, data: UpdateModuleData): Promise<Module>;
  remove(id: string): Promise<void>;
}
