import type { Cnae } from '@ged/database';

export interface UpsertCompanyCnaeData {
  readonly codigo: string;
  readonly descricao: string;
  readonly principal?: boolean;
}

export interface ICompanyCnaeRepository {
  findAllByCompany(companyId: string): Promise<Cnae[]>;
  findByIdAndCompany(id: string, companyId: string): Promise<Cnae | null>;
  findByCodigoAndCompany(codigo: string, companyId: string): Promise<Cnae | null>;
  create(companyId: string, data: UpsertCompanyCnaeData): Promise<Cnae>;
  update(id: string, data: UpsertCompanyCnaeData): Promise<Cnae>;
  delete(id: string): Promise<void>;
  unsetPrincipal(companyId: string, exceptId?: string): Promise<void>;
}
