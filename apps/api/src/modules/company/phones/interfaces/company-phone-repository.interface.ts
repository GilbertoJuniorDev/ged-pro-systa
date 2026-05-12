import type { Phone, PhoneType } from '@ged/database';

export interface UpsertCompanyPhoneData {
  readonly tipo: PhoneType;
  readonly numero: string;
}

export interface ICompanyPhoneRepository {
  findAllByCompany(companyId: string): Promise<Phone[]>;
  findByIdAndCompany(id: string, companyId: string): Promise<Phone | null>;
  create(companyId: string, data: UpsertCompanyPhoneData): Promise<Phone>;
  update(id: string, data: UpsertCompanyPhoneData): Promise<Phone>;
  delete(id: string): Promise<void>;
}
