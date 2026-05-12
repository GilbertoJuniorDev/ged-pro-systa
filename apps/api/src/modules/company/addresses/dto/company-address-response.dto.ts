import type { Address, AddressType } from '@ged/database';

export class CompanyAddressResponseDto {
  readonly id!: string;
  readonly companyId!: string;
  readonly tipo!: AddressType;
  readonly logradouro!: string;
  readonly numero!: string;
  readonly complemento!: string | null;
  readonly bairro!: string;
  readonly cidade!: string;
  readonly estado!: string;
  readonly cep!: string;
  readonly createdAt!: string;
  readonly updatedAt!: string;

  constructor(a: Address) {
    this.id = a.id;
    this.companyId = a.companyId ?? '';
    this.tipo = a.tipo;
    this.logradouro = a.logradouro;
    this.numero = a.numero;
    this.complemento = a.complemento;
    this.bairro = a.bairro;
    this.cidade = a.cidade;
    this.estado = a.estado;
    this.cep = a.cep;
    this.createdAt = a.createdAt.toISOString();
    this.updatedAt = a.updatedAt.toISOString();
  }
}
