import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

/**
 * Company (Pessoa Jurídica) — singleton entity.
 *
 * Cada instância (container) do GED Pro pertence a um único cliente.
 * Por isso a tabela `company` aceita apenas 1 linha, garantido pela
 * coluna sentinel `singleton` (UNIQUE + CHECK).
 */
@Entity('company')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'cnpj', length: 14, unique: true })
  cnpj!: string;

  @Column({ name: 'razao_social' })
  razaoSocial!: string;

  @Column({ name: 'nome_fantasia', nullable: true, type: 'varchar' })
  nomeFantasia!: string | null;

  @Column({ name: 'nome_empresarial', nullable: true, type: 'varchar' })
  nomeEmpresarial!: string | null;

  @Column({ name: 'inscricao_estadual', nullable: true, type: 'varchar' })
  inscricaoEstadual!: string | null;

  @Column({ name: 'matriz', type: 'boolean', default: true })
  matriz!: boolean;

  @Column({ name: 'data_abertura', type: 'date', nullable: true })
  dataAbertura!: Date | null;

  @Column({ name: 'porte', type: 'varchar', nullable: true })
  porte!: string | null;

  @Column({ name: 'natureza_juridica_codigo', type: 'varchar', nullable: true })
  naturezaJuridicaCodigo!: string | null;

  @Column({ name: 'natureza_juridica_descricao', type: 'varchar', nullable: true })
  naturezaJuridicaDescricao!: string | null;

  @Column({ name: 'situacao_cadastral', type: 'varchar', nullable: true })
  situacaoCadastral!: string | null;

  @Column({ name: 'situacao_cadastral_data', type: 'date', nullable: true })
  situacaoCadastralData!: Date | null;

  /**
   * Coluna sentinel para garantir singleton.
   * Sempre 'X'; UNIQUE + CHECK garantem apenas 1 linha.
   */
  @Column({
    name: 'singleton',
    type: 'char',
    length: 1,
    default: 'X',
    unique: true,
    select: false,
  })
  readonly singleton!: 'X';

  @OneToMany('Address', 'company')
  addresses!: unknown[];

  @OneToMany('Phone', 'company')
  phones!: unknown[];

  @OneToMany('Email', 'company')
  emails!: unknown[];

  @OneToMany('Cnae', 'company')
  cnaes!: unknown[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
