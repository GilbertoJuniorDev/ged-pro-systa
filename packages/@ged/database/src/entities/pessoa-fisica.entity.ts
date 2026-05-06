import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export const SEXO = {
  MASCULINO: 'M',
  FEMININO: 'F',
  OUTRO: 'O',
} as const;

export type Sexo = (typeof SEXO)[keyof typeof SEXO];

@Entity('pessoa_fisicas')
export class PessoaFisica {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', unique: true })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  usuario!: User;

  @Column({ name: 'nome' })
  nome!: string;

  @Column({ name: 'sobrenome' })
  sobrenome!: string;

  @Column({ name: 'cpf', unique: true, length: 11 })
  cpf!: string;

  @Column({ name: 'data_nascimento', type: 'date' })
  dataNascimento!: Date;

  @Column({
    name: 'sexo',
    type: 'enum',
    enum: ['M', 'F', 'O'],
  })
  sexo!: Sexo;

  @OneToMany('Endereco', 'pessoaFisica')
  enderecos!: unknown[];

  @OneToMany('Telefone', 'pessoaFisica')
  telefones!: unknown[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
