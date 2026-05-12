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

export const EMAIL_TYPE = {
  PRINCIPAL: 'PRINCIPAL',
  FINANCEIRO: 'FINANCEIRO',
  COMERCIAL: 'COMERCIAL',
  OUTRO: 'OUTRO',
} as const;

export type EmailType = (typeof EMAIL_TYPE)[keyof typeof EMAIL_TYPE];

@Entity('emails')
export class Email {
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
    enum: ['PRINCIPAL', 'FINANCEIRO', 'COMERCIAL', 'OUTRO'],
    default: EMAIL_TYPE.PRINCIPAL,
  })
  tipo!: EmailType;

  @Column({ name: 'endereco', length: 255 })
  endereco!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
