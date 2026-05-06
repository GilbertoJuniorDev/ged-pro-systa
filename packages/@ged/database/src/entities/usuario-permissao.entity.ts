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
import { Permissao } from './permissao.entity';

@Entity('usuario_permissoes')
@Unique(['usuarioId', 'permissaoId'])
export class UsuarioPermissao {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'usuario_id' })
  usuarioId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: User;

  @Column({ name: 'permissao_id' })
  permissaoId!: string;

  @ManyToOne(() => Permissao, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissao_id' })
  permissao!: Permissao;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
