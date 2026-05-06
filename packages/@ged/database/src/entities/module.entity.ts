import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'nome', unique: true })
  nome!: string;

  @Column({ name: 'slug', unique: true })
  slug!: string;

  @Column({ name: 'descricao', type: 'varchar', nullable: true })
  descricao!: string | null;

  @Column({ name: 'icone', type: 'varchar', nullable: true })
  icone!: string | null;

  @Column({ name: 'ordem', type: 'int', default: 0 })
  ordem!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany('Permission', 'modulo')
  permissions!: unknown[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
