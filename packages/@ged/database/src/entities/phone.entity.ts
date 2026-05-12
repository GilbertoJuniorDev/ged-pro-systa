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
import { Company } from './company.entity';

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

  @Column({ name: 'pessoa_fisica_id', type: 'uuid', nullable: true })
  pessoaFisicaId!: string | null;

  @ManyToOne(() => PhysicalPerson, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'pessoa_fisica_id' })
  physicalPerson!: PhysicalPerson | null;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId!: string | null;

  @ManyToOne(() => Company, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'company_id' })
  company!: Company | null;

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
