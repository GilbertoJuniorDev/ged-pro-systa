import type { Telefone, TipoTelefone } from '@ged/database';

export interface CreateTelefoneData {
  readonly pessoaFisicaId: string;
  readonly tipo: TipoTelefone;
  readonly numero: string;
}

export interface UpdateTelefoneData {
  readonly tipo?: TipoTelefone;
  readonly numero?: string;
}

export interface ITelefoneRepository {
  findByPessoaFisicaId(pessoaFisicaId: string): Promise<Telefone[]>;
  findById(id: string): Promise<Telefone | null>;
  create(data: CreateTelefoneData): Promise<Telefone>;
  update(id: string, data: UpdateTelefoneData): Promise<Telefone>;
  remove(id: string): Promise<void>;
}
