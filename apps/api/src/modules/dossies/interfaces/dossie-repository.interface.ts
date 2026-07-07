import type { Dossie } from '@ged/database';

export interface CreateDossieData {
  readonly nome: string;
  readonly descricao?: string | null;
  readonly isActive?: boolean;
  readonly departamentoId: string;
}

export interface UpdateDossieData {
  readonly nome?: string;
  readonly descricao?: string | null;
  readonly isActive?: boolean;
}

export interface IDossieRepository {
  findAll(filter?: { departamentoId?: string }): Promise<Dossie[]>;
  findById(id: string): Promise<Dossie | null>;
  create(data: CreateDossieData): Promise<Dossie>;
  update(id: string, data: UpdateDossieData): Promise<Dossie>;
  delete(id: string): Promise<void>;
}
