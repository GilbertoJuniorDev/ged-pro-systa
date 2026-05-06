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

export const PHONE_TYPE = {
  MOBILE: 'CELULAR',
  RESIDENTIAL: 'RESIDENCIAL',
  COMMERCIAL: 'COMERCIAL',
} as const;

export type PhoneType = (typeof PHONE_TYPE)[keyof typeof PHONE_TYPE];

@Entity('phones')
export class Phone {
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
    enum: ['CELULAR', 'RESIDENCIAL', 'COMERCIAL'],
    default: PHONE_TYPE.MOBILE,
  })
  tipo!: PhoneType;

  @Column({ name: 'numero' })
  numero!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
