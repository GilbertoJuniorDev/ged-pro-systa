import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Document } from './document.entity';

export const TIPO_DOCUMENTO = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
} as const;

export type TipoDocumento = (typeof TIPO_DOCUMENTO)[keyof typeof TIPO_DOCUMENTO];

@Entity('document_leads')
export class DocumentLead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'email' })
  email!: string;

  @Column({ name: 'nome' })
  nome!: string;

  @Column({ name: 'documento' })
  documento!: string;

  @Column({
    name: 'tipo_documento',
    type: 'enum',
    enum: ['CPF', 'CNPJ'],
  })
  tipoDocumento!: TipoDocumento;

  @Column({ name: 'document_id', type: 'uuid', nullable: true })
  documentId!: string | null;

  @ManyToOne(() => Document, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'document_id' })
  document!: Document | null;

  @Column({ name: 'ip_cliente', type: 'varchar', nullable: true })
  ipCliente!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
