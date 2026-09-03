import type { Arquivo, ArquivoStatus } from '@ged/database';

export interface ArquivoQueryFilter {
  readonly departamentoId?: string;
  readonly status?: ArquivoStatus;
  readonly ano?: number;
  readonly search?: string;
  readonly page?: number;
  readonly limit?: number;
  // Quando definido, restringe a listagem aos arquivos visíveis a um usuário não-privilegiado
  // (dono OU vinculado via arquivo_departments). Ausente = papel privilegiado, sem restrição.
  readonly allowedDepartamentoIds?: readonly string[];
}

export interface PaginatedArquivos {
  readonly data: Arquivo[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface UpdateArquivoData {
  readonly nome?: string;
  readonly descricao?: string | null;
  readonly predio?: string | null;
  readonly sala?: string | null;
  readonly estante?: string | null;
  readonly prateleira?: string | null;
  readonly caixa?: string | null;
  readonly status?: ArquivoStatus;
  readonly dataEncerramento?: Date | null;
  readonly encerradoPorId?: string | null;
}

export interface IArquivoRepository {
  findAll(filter: ArquivoQueryFilter): Promise<PaginatedArquivos>;
  findById(id: string): Promise<Arquivo | null>;
  update(id: string, data: UpdateArquivoData): Promise<Arquivo>;
  delete(id: string): Promise<void>;
  findDepartamentoIds(arquivoId: string): Promise<string[]>;
  // Versão em lote de findDepartamentoIds — evita 1 query por linha ao listar uma página.
  // Chaves ausentes do Map significam "sem departamentos vinculados".
  findDepartamentoIdsByArquivos(arquivoIds: readonly string[]): Promise<Map<string, string[]>>;
  syncDepartamentos(arquivoId: string, departamentoIds: readonly string[]): Promise<void>;
  // Conta dossiês por arquivo. Chaves ausentes do Map significam contagem 0.
  countDossiesByArquivo(arquivoIds: readonly string[]): Promise<Map<string, number>>;
}
