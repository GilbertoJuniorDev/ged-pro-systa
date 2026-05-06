import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'usuario_id', type: 'varchar', nullable: true })
  usuarioId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: User | null;

  @Column({ name: 'acao' })
  acao!: string;

  @Column({ name: 'entidade', type: 'varchar', nullable: true })
  entidade!: string | null;

  @Column({ name: 'entidade_id', type: 'varchar', nullable: true })
  entidadeId!: string | null;

  @Column({ name: 'ip_cliente', type: 'varchar', nullable: true })
  ipCliente!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
