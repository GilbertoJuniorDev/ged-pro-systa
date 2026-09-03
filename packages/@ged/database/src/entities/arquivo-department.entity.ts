import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Arquivo } from './arquivo.entity';
import { Department } from './department.entity';

@Entity('arquivo_departments')
@Unique(['arquivoId', 'departamentoId'])
export class ArquivoDepartment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'arquivo_id', type: 'uuid' })
  arquivoId!: string;

  @ManyToOne(() => Arquivo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'arquivo_id' })
  arquivo!: Arquivo;

  @Column({ name: 'departamento_id', type: 'uuid' })
  departamentoId!: string;

  @ManyToOne(() => Department, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'departamento_id' })
  departamento!: Department;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
