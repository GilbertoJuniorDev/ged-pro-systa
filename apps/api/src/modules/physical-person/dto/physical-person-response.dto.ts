import type { Gender, AddressType, PhoneType } from '@ged/database';

export class PhysicalPersonResponseDto {
  readonly id!: string;
  readonly userId!: string;
  readonly nome!: string;
  readonly sobrenome!: string;
  readonly cpf!: string;
  readonly dataNascimento!: Date;
  readonly sexo!: Gender;
  readonly createdAt!: Date;

  constructor(partial: PhysicalPersonResponseDto) {
    Object.assign(this, partial);
  }
}

export class AddressResponseDto {
  readonly id!: string;
  readonly physicalPersonId!: string;
  readonly tipo!: AddressType;
  readonly logradouro!: string;
  readonly numero!: string;
  readonly complemento!: string | null;
  readonly bairro!: string;
  readonly cidade!: string;
  readonly estado!: string;
  readonly cep!: string;
  readonly createdAt!: Date;

  constructor(partial: AddressResponseDto) {
    Object.assign(this, partial);
  }
}

export class PhoneResponseDto {
  readonly id!: string;
  readonly physicalPersonId!: string;
  readonly tipo!: PhoneType;
  readonly numero!: string;
  readonly createdAt!: Date;

  constructor(partial: PhoneResponseDto) {
    Object.assign(this, partial);
  }
}
