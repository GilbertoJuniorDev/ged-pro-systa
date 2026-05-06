import type { Sexo, TipoEndereco, TipoTelefone } from '@ged/database';

export class PessoaFisicaResponseDto {
  readonly id!: string;
  readonly userId!: string;
  readonly nome!: string;
  readonly sobrenome!: string;
  readonly cpf!: string;
  readonly dataNascimento!: Date;
  readonly sexo!: Sexo;
  readonly createdAt!: Date;

  constructor(partial: PessoaFisicaResponseDto) {
    Object.assign(this, partial);
  }
}

export class EnderecoResponseDto {
  readonly id!: string;
  readonly pessoaFisicaId!: string;
  readonly tipo!: TipoEndereco;
  readonly logradouro!: string;
  readonly numero!: string;
  readonly complemento!: string | null;
  readonly bairro!: string;
  readonly cidade!: string;
  readonly estado!: string;
  readonly cep!: string;
  readonly createdAt!: Date;

  constructor(partial: EnderecoResponseDto) {
    Object.assign(this, partial);
  }
}

export class TelefoneResponseDto {
  readonly id!: string;
  readonly pessoaFisicaId!: string;
  readonly tipo!: TipoTelefone;
  readonly numero!: string;
  readonly createdAt!: Date;

  constructor(partial: TelefoneResponseDto) {
    Object.assign(this, partial);
  }
}
