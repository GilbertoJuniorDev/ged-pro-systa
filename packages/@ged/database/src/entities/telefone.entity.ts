import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PessoaFisica } from './pessoa-fisica.entity';

export const TIPO_TELEFONE = {
  CELULAR: 'CELULAR',
  RESIDENCIAL: 'RESIDENCIAL',
  COMERCIAL: 'COMERCIAL',
} as const;

export type TipoTelefone = (typeof TIPO_TELEFONE)[keyof typeof TIPO_TELEFONE];

@Entity('telefones')
export class Telefone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'pessoa_fisica_id' })
  pessoaFisicaId!: string;

  @ManyToOne(() => PessoaFisica, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pessoa_fisica_id' })
  pessoaFisica!: PessoaFisica;

  @Column({
    name: 'tipo',
    type: 'enum',
    enum: ['CELULAR', 'RESIDENCIAL', 'COMERCIAL'],
    default: TIPO_TELEFONE.CELULAR,
  })
  tipo!: TipoTelefone;

  @Column({ name: 'numero' })
  numero!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
