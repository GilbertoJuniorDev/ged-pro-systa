import type { PessoaFisica, Sexo } from '@ged/database';

export interface CreatePessoaFisicaData {
  readonly userId: string;
  readonly nome: string;
  readonly sobrenome: string;
  readonly cpf: string;
  readonly dataNascimento: Date;
  readonly sexo: Sexo;
}

export interface UpdatePessoaFisicaData {
  readonly nome?: string;
  readonly sobrenome?: string;
  readonly dataNascimento?: Date;
  readonly sexo?: Sexo;
}

export interface IPessoaFisicaRepository {
  findByUserId(userId: string): Promise<PessoaFisica | null>;
  findById(id: string): Promise<PessoaFisica | null>;
  findByCpf(cpf: string): Promise<PessoaFisica | null>;
  create(data: CreatePessoaFisicaData): Promise<PessoaFisica>;
  update(id: string, data: UpdatePessoaFisicaData): Promise<PessoaFisica>;
}
