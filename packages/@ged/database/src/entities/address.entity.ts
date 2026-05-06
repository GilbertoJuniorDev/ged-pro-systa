import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PhysicalPerson } from './physical-person.entity';

export const ADDRESS_TYPE = {
  RESIDENTIAL: 'RESIDENCIAL',
  COMMERCIAL: 'COMERCIAL',
  OTHER: 'OUTRO',
} as const;

export type AddressType = (typeof ADDRESS_TYPE)[keyof typeof ADDRESS_TYPE];

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'pessoa_fisica_id' })
  pessoaFisicaId!: string;

  @ManyToOne(() => PhysicalPerson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pessoa_fisica_id' })
  physicalPerson!: PhysicalPerson;

  @Column({
    name: 'tipo',
    type: 'enum',
    enum: ['RESIDENCIAL', 'COMERCIAL', 'OUTRO'],
    default: ADDRESS_TYPE.RESIDENTIAL,
  })
  tipo!: AddressType;

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
