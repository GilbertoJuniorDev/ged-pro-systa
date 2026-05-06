import type { Permissao } from '@ged/database';

export interface CreatePermissaoData {
  readonly nome: string;
  readonly descricao?: string | null;
  readonly moduloId?: string | null;
}

export interface UpdatePermissaoData {
  readonly nome?: string;
  readonly descricao?: string | null;
  readonly moduloId?: string | null;
}

export interface IPermissaoRepository {
  findAll(): Promise<Permissao[]>;
  findById(id: string): Promise<Permissao | null>;
  findByNome(nome: string): Promise<Permissao | null>;
  create(data: CreatePermissaoData): Promise<Permissao>;
  update(id: string, data: UpdatePermissaoData): Promise<Permissao>;
  remove(id: string): Promise<void>;
}
