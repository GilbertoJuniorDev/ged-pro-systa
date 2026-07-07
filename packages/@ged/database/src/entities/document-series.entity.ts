import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Department } from './department.entity';

export const DESTINACAO_FINAL = {
  GUARDA_PERMANENTE: 'GUARDA_PERMANENTE',
  ELIMINACAO: 'ELIMINACAO',
} as const;

export type DestinacaoFinal = (typeof DESTINACAO_FINAL)[keyof typeof DESTINACAO_FINAL];

@Entity('document_series')
export class DocumentSeries {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'codigo' })
  codigo!: string;

  @Column({ name: 'nome' })
  nome!: string;

  @Column({ name: 'descricao', type: 'varchar', nullable: true })
  descricao!: string | null;

  @Column({ name: 'prazo_corrente_meses', type: 'int' })
  prazoCorrenteMeses!: number;

  @Column({ name: 'prazo_intermediario_meses', type: 'int' })
  prazoIntermediarioMeses!: number;

  @Column({
    name: 'destinacao_final',
    type: 'enum',
    enum: ['GUARDA_PERMANENTE', 'ELIMINACAO'],
  })
  destinacaoFinal!: DestinacaoFinal;

  @Column({ name: 'base_legal', type: 'text', nullable: true })
  baseLegal!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'departamento_id', type: 'uuid' })
  departamentoId!: string;

  @ManyToOne(() => Department, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'departamento_id' })
  departamento!: Department;

  @Column({ name: 'serie_pai_id', type: 'uuid', nullable: true })
  seriePaiId!: string | null;

  @ManyToOne(() => DocumentSeries, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'serie_pai_id' })
  seriePai!: DocumentSeries | null;

  @OneToMany('DocumentSeries', 'seriePai')
  seriesFilhas!: DocumentSeries[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
