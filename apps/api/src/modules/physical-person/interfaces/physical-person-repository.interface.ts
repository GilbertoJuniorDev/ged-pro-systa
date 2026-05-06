import type { PhysicalPerson, Gender } from '@ged/database';

export interface CreatePhysicalPersonData {
  readonly userId: string;
  readonly nome: string;
  readonly sobrenome: string;
  readonly cpf: string;
  readonly dataNascimento: Date;
  readonly sexo: Gender;
}

export interface UpdatePhysicalPersonData {
  readonly nome?: string;
  readonly sobrenome?: string;
  readonly dataNascimento?: Date;
  readonly sexo?: Gender;
}

export interface IPhysicalPersonRepository {
  findByUserId(userId: string): Promise<PhysicalPerson | null>;
  findById(id: string): Promise<PhysicalPerson | null>;
  findByCpf(cpf: string): Promise<PhysicalPerson | null>;
  create(data: CreatePhysicalPersonData): Promise<PhysicalPerson>;
  update(id: string, data: UpdatePhysicalPersonData): Promise<PhysicalPerson>;
}
