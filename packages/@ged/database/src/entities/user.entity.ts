import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ROLE, type Role } from '@ged/types';

export { ROLE, type Role } from '@ged/types';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name' })
  name!: string;

  @Column({ name: 'email', unique: true })
  email!: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash!: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: ['ADMIN', 'VIEWER', 'SUPER_ADMIN'],
    default: ROLE.VIEWER,
  })
  role!: Role;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany('RefreshToken', 'user')
  refreshTokens!: unknown[];

  @OneToOne('PhysicalPerson', 'usuario')
  pessoaFisica!: unknown;

  @OneToMany('UserPermission', 'usuario')
  usuarioPermissoes!: unknown[];

  @OneToMany('UserDepartment', 'usuario')
  usuarioDepartamentos!: unknown[];

  @OneToMany('AuditLog', 'usuario')
  auditLogs!: unknown[];
}
