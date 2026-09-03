import type { Dossie } from '@ged/database';

export interface CreateDossieData {
  readonly nome: string;
  readonly descricao?: string | null;
  readonly isActive?: boolean;
  readonly departamentoId: string;
  readonly arquivoId?: string | null;
}

export interface UpdateDossieData {
  readonly nome?: string;
  readonly descricao?: string | null;
  readonly isActive?: boolean;
  readonly arquivoId?: string | null;
}

export interface DossieQueryFilter {
  readonly departamentoId?: string;
  readonly arquivoId?: string;
  // Quando true, restringe a listagem a dossiês sem arquivo (arquivoId IS NULL).
  readonly semArquivo?: boolean;
  readonly search?: string;
  readonly page?: number;
  readonly limit?: number;
  // Quando definido, restringe a listagem aos dossiês desses departamentos.
  readonly allowedDepartamentoIds?: readonly string[];
}

export interface PaginatedDossies {
  readonly data: Dossie[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface IDossieRepository {
  findAll(filter: DossieQueryFilter): Promise<PaginatedDossies>;
  findById(id: string): Promise<Dossie | null>;
  create(data: CreateDossieData): Promise<Dossie>;
  update(id: string, data: UpdateDossieData): Promise<Dossie>;
  delete(id: string): Promise<void>;
  // Conta documentos por dossiê, respeitando o escopo de acesso (null = sem restrição).
  // Chaves ausentes do Map significam contagem 0.
  countDocumentsByDossie(
    dossieIds: readonly string[],
    accessScope: { readonly userId: string; readonly userDepartamentoIds: readonly string[] } | null,
  ): Promise<Map<string, number>>;
}
