import type { Modulo } from '@ged/database';

export interface CreateModuloData {
  readonly nome: string;
  readonly slug: string;
  readonly descricao?: string | null;
  readonly icone?: string | null;
  readonly ordem?: number;
}

export interface UpdateModuloData {
  readonly nome?: string;
  readonly slug?: string;
  readonly descricao?: string | null;
  readonly icone?: string | null;
  readonly ordem?: number;
  readonly isActive?: boolean;
}

export interface IModuloRepository {
  findAll(): Promise<Modulo[]>;
  findById(id: string): Promise<Modulo | null>;
  findBySlug(slug: string): Promise<Modulo | null>;
  create(data: CreateModuloData): Promise<Modulo>;
  update(id: string, data: UpdateModuloData): Promise<Modulo>;
  remove(id: string): Promise<void>;
}
