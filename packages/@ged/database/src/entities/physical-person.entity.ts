import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export const GENDER = {
  MALE: 'M',
  FEMALE: 'F',
  OTHER: 'O',
} as const;

export type Gender = (typeof GENDER)[keyof typeof GENDER];

@Entity('physical_persons')
export class PhysicalPerson {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', unique: true })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  usuario!: User;

  @Column({ name: 'nome' })
  nome!: string;

  @Column({ name: 'sobrenome' })
  sobrenome!: string;

  @Column({ name: 'cpf', unique: true, length: 11 })
  cpf!: string;

  @Column({ name: 'data_nascimento', type: 'date' })
  dataNascimento!: Date;

  @Column({
    name: 'sexo',
    type: 'enum',
    enum: ['M', 'F', 'O'],
  })
  sexo!: Gender;

  @OneToMany('Address', 'physicalPerson')
  addresses!: unknown[];

  @OneToMany('Phone', 'physicalPerson')
  phones!: unknown[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
