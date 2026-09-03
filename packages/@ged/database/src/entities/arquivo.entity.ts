import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Department } from './department.entity';

// "Arquivo" aqui é a unidade de guarda física (dossiê/pasta no nível mais externo
// da hierarquia arquivística), diferente dos campos `arquivo_*` de `Document`
// (que descrevem o binário anexado ao documento).
export const ARQUIVO_STATUS = {
  ABERTO: 'ABERTO',
  FECHADO: 'FECHADO',
} as const;

export type ArquivoStatus = (typeof ARQUIVO_STATUS)[keyof typeof ARQUIVO_STATUS];

@Entity('arquivos')
@Unique(['departamentoId', 'ano', 'sequencia'])
export class Arquivo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'codigo' })
  codigo!: string;

  @Column({ name: 'ano', type: 'int' })
  ano!: number;

  @Column({ name: 'sequencia', type: 'int' })
  sequencia!: number;

  @Column({ name: 'nome' })
  nome!: string;

  @Column({ name: 'descricao', type: 'varchar', nullable: true })
  descricao!: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['ABERTO', 'FECHADO'],
    default: ARQUIVO_STATUS.ABERTO,
  })
  status!: ArquivoStatus;

  @Column({ name: 'data_encerramento', type: 'timestamp', nullable: true })
  dataEncerramento!: Date | null;

  @Column({ name: 'encerrado_por_id', type: 'uuid', nullable: true })
  encerradoPorId!: string | null;

  @Column({ name: 'predio', type: 'varchar', nullable: true })
  predio!: string | null;

  @Column({ name: 'sala', type: 'varchar', nullable: true })
  sala!: string | null;

  @Column({ name: 'estante', type: 'varchar', nullable: true })
  estante!: string | null;

  @Column({ name: 'prateleira', type: 'varchar', nullable: true })
  prateleira!: string | null;

  @Column({ name: 'caixa', type: 'varchar', nullable: true })
  caixa!: string | null;

  @Column({ name: 'departamento_id', type: 'uuid' })
  departamentoId!: string;

  @ManyToOne(() => Department, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'departamento_id' })
  departamento!: Department;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
