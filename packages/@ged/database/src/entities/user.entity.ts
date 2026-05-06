import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';


export const ROLE = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  VIEWER: 'VIEWER',
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

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
    enum: ['ADMIN', 'MANAGER', 'VIEWER'],
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

  @OneToOne('PessoaFisica', 'usuario')
  pessoaFisica!: unknown;

  @OneToMany('UsuarioPermissao', 'usuario')
  usuarioPermissoes!: unknown[];

  @OneToMany('AuditLog', 'usuario')
  auditLogs!: unknown[];
}
