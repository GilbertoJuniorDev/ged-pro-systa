import type { Address, AddressType } from '@ged/database';

export interface UpsertCompanyAddressData {
  readonly tipo: AddressType;
  readonly logradouro: string;
  readonly numero: string;
  readonly complemento?: string | null;
  readonly bairro: string;
  readonly cidade: string;
  readonly estado: string;
  readonly cep: string;
}

export interface ICompanyAddressRepository {
  findAllByCompany(companyId: string): Promise<Address[]>;
  findByIdAndCompany(id: string, companyId: string): Promise<Address | null>;
  create(companyId: string, data: UpsertCompanyAddressData): Promise<Address>;
  update(id: string, data: UpsertCompanyAddressData): Promise<Address>;
  delete(id: string): Promise<void>;
}
