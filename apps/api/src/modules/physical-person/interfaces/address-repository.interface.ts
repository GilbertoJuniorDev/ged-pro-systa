import type { Address, AddressType } from '@ged/database';

export interface CreateAddressData {
  readonly physicalPersonId: string;
  readonly tipo: AddressType;
  readonly logradouro: string;
  readonly numero: string;
  readonly complemento?: string | null;
  readonly bairro: string;
  readonly cidade: string;
  readonly estado: string;
  readonly cep: string;
}

export interface UpdateAddressData {
  readonly tipo?: AddressType;
  readonly logradouro?: string;
  readonly numero?: string;
  readonly complemento?: string | null;
  readonly bairro?: string;
  readonly cidade?: string;
  readonly estado?: string;
  readonly cep?: string;
}

export interface IAddressRepository {
  findByPhysicalPersonId(physicalPersonId: string): Promise<Address[]>;
  findById(id: string): Promise<Address | null>;
  create(data: CreateAddressData): Promise<Address>;
  update(id: string, data: UpdateAddressData): Promise<Address>;
  remove(id: string): Promise<void>;
}
