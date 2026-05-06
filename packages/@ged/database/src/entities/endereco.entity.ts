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

export const TIPO_ENDERECO = {
  RESIDENCIAL: 'RESIDENCIAL',
  COMERCIAL: 'COMERCIAL',
  OUTRO: 'OUTRO',
} as const;

export type TipoEndereco = (typeof TIPO_ENDERECO)[keyof typeof TIPO_ENDERECO];

@Entity('enderecos')
export class Endereco {
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
    enum: ['RESIDENCIAL', 'COMERCIAL', 'OUTRO'],
    default: TIPO_ENDERECO.RESIDENCIAL,
  })
  tipo!: TipoEndereco;

  @Column({ name: 'logradouro' })
  logradouro!: string;

  @Column({ name: 'numero' })
  numero!: string;

  @Column({ name: 'complemento', type: 'varchar', nullable: true })
  complemento!: string | null;

  @Column({ name: 'bairro' })
  bairro!: string;

  @Column({ name: 'cidade' })
  cidade!: string;

  @Column({ name: 'estado', length: 2 })
  estado!: string;

  @Column({ name: 'cep', length: 8 })
  cep!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
