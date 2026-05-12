import type { Email, EmailType } from '@ged/database';

export interface UpsertCompanyEmailData {
  readonly tipo: EmailType;
  readonly endereco: string;
}

export interface ICompanyEmailRepository {
  findAllByCompany(companyId: string): Promise<Email[]>;
  findByIdAndCompany(id: string, companyId: string): Promise<Email | null>;
  create(companyId: string, data: UpsertCompanyEmailData): Promise<Email>;
  update(id: string, data: UpsertCompanyEmailData): Promise<Email>;
  delete(id: string): Promise<void>;
}
