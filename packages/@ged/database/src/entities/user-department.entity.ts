import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Department } from './department.entity';

@Entity('user_departments')
@Unique(['usuarioId', 'departamentoId'])
export class UserDepartment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'usuario_id' })
  usuarioId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: User;

  @Column({ name: 'departamento_id' })
  departamentoId!: string;

  @ManyToOne(() => Department, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'departamento_id' })
  departamento!: Department;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
