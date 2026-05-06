import type { Endereco, TipoEndereco } from '@ged/database';

export interface CreateEnderecoData {
  readonly pessoaFisicaId: string;
  readonly tipo: TipoEndereco;
  readonly logradouro: string;
  readonly numero: string;
  readonly complemento?: string | null;
  readonly bairro: string;
  readonly cidade: string;
  readonly estado: string;
  readonly cep: string;
}

export interface UpdateEnderecoData {
  readonly tipo?: TipoEndereco;
  readonly logradouro?: string;
  readonly numero?: string;
  readonly complemento?: string | null;
  readonly bairro?: string;
  readonly cidade?: string;
  readonly estado?: string;
  readonly cep?: string;
}

export interface IEnderecoRepository {
  findByPessoaFisicaId(pessoaFisicaId: string): Promise<Endereco[]>;
  findById(id: string): Promise<Endereco | null>;
  create(data: CreateEnderecoData): Promise<Endereco>;
  update(id: string, data: UpdateEnderecoData): Promise<Endereco>;
  remove(id: string): Promise<void>;
}
