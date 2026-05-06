import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'nome', unique: true })
  nome!: string;

  @Column({ name: 'descricao', type: 'varchar', nullable: true })
  descricao!: string | null;

  @Column({ name: 'modulo_id', type: 'uuid', nullable: true })
  moduloId!: string | null;

  @ManyToOne('Module', 'permissions', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'modulo_id' })
  modulo!: unknown;

  @OneToMany('UserPermission', 'permissao')
  userPermissions!: unknown[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
