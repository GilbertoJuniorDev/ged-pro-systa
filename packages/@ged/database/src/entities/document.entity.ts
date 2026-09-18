import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Department } from './department.entity';
import { DocumentSeries } from './document-series.entity';
import { Dossie } from './dossie.entity';

export const CONFIDENCIALIDADE = {
  PUBLICO: 'PUBLICO',
  RESTRITO: 'RESTRITO',
  CONFIDENCIAL: 'CONFIDENCIAL',
} as const;

export type Confidencialidade = (typeof CONFIDENCIALIDADE)[keyof typeof CONFIDENCIALIDADE];

export const DOCUMENT_FASE = {
  CORRENTE: 'CORRENTE',
  INTERMEDIARIO: 'INTERMEDIARIO',
} as const;

export type DocumentFase = (typeof DOCUMENT_FASE)[keyof typeof DOCUMENT_FASE];

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'nome' })
  nome!: string;

  @Column({ name: 'descricao', type: 'varchar', nullable: true })
  descricao!: string | null;

  @Column({ name: 'validade', type: 'date', nullable: true })
  validade!: Date | null;

  @Column({
    name: 'confidencialidade',
    type: 'enum',
    enum: ['PUBLICO', 'RESTRITO', 'CONFIDENCIAL'],
    default: CONFIDENCIALIDADE.RESTRITO,
  })
  confidencialidade!: Confidencialidade;

  @Column({ name: 'departamento_id', type: 'uuid', nullable: true })
  departamentoId!: string | null;

  @ManyToOne(() => Department, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'departamento_id' })
  departamento!: Department | null;

  @Column({ name: 'serie_id', type: 'uuid', nullable: true })
  serieId!: string | null;

  @ManyToOne(() => DocumentSeries, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'serie_id' })
  serie!: DocumentSeries | null;

  @Column({ name: 'dossie_id', type: 'uuid', nullable: true })
  dossieId!: string | null;

  @ManyToOne(() => Dossie, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'dossie_id' })
  dossie!: Dossie | null;

  @Column({
    name: 'fase',
    type: 'enum',
    enum: ['CORRENTE', 'INTERMEDIARIO'],
    default: DOCUMENT_FASE.CORRENTE,
  })
  fase!: DocumentFase;

  @Column({ name: 'fase_corrente_desde', type: 'date' })
  faseCorrenteDesde!: Date;

  @Column({ name: 'fase_intermediario_desde', type: 'date', nullable: true })
  faseIntermediarioDesde!: Date | null;

  @Column({ name: 'arquivo_nome' })
  arquivoNome!: string;

  @Column({ name: 'arquivo_chave' })
  arquivoChave!: string;

  @Column({ name: 'arquivo_mime_type' })
  arquivoMimeType!: string;

  @Column({ name: 'arquivo_tamanho', type: 'int' })
  arquivoTamanho!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'destaque', default: false })
  destaque!: boolean;

  @Column({ name: 'exige_cadastro', default: false })
  exigeCadastro!: boolean;

  // Autor do upload. É o que mantém um documento não classificado
  // (departamento_id NULL) visível ao próprio autor — ver access-scope.ts.
  @Column({ name: 'criado_por', type: 'uuid', nullable: true })
  criadoPor!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
