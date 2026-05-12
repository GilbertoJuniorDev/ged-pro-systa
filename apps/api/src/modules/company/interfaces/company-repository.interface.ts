import type { Company } from '@ged/database';

export interface UpsertCompanyData {
  readonly cnpj: string;
  readonly razaoSocial: string;
  readonly nomeFantasia?: string | null;
  readonly nomeEmpresarial?: string | null;
  readonly inscricaoEstadual?: string | null;
  readonly matriz?: boolean;
  readonly dataAbertura?: Date | string | null;
  readonly porte?: string | null;
  readonly naturezaJuridicaCodigo?: string | null;
  readonly naturezaJuridicaDescricao?: string | null;
  readonly situacaoCadastral?: string | null;
  readonly situacaoCadastralData?: Date | string | null;
}

export interface ICompanyRepository {
  findSingleton(): Promise<Company | null>;
  upsert(data: UpsertCompanyData): Promise<Company>;
}
