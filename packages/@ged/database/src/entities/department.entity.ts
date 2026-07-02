import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'nome', unique: true })
  nome!: string;

  @Column({ name: 'descricao', type: 'varchar', nullable: true })
  descricao!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany('UserDepartment', 'departamento')
  usuarioDepartamentos!: unknown[];
}
