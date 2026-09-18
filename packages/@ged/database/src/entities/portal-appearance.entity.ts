import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * PortalAppearance — singleton entity.
 *
 * Customização visual do portal público (`/portal`, anônimo): paleta de cores,
 * logo e textos principais — totalmente independente de `AppearanceSetting`
 * (tema do sistema). Mesmo padrão singleton de `Company`.
 */
@Entity('portal_appearances')
export class PortalAppearance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'primary_color', type: 'varchar', length: 7, default: '#4f46e5' })
  primaryColor!: string;

  @Column({ name: 'secondary_color', type: 'varchar', length: 7, default: '#0ea5e9' })
  secondaryColor!: string;

  @Column({ name: 'background_color', type: 'varchar', length: 7, default: '#f8fafc' })
  backgroundColor!: string;

  @Column({ name: 'logo_path', type: 'varchar', nullable: true })
  logoPath!: string | null;

  @Column({ name: 'logo_mime_type', type: 'varchar', nullable: true })
  logoMimeType!: string | null;

  @Column({ name: 'logo_version', type: 'int', default: 0 })
  logoVersion!: number;

  @Column({ name: 'hero_title', type: 'varchar', length: 200, default: 'Portal de Documentos Públicos' })
  heroTitle!: string;

  @Column({
    name: 'hero_subtitle',
    type: 'varchar',
    length: 400,
    default:
      'Consulte e baixe documentos disponibilizados publicamente. Busque por nome, filtre por série e acesse o conteúdo em poucos cliques.',
  })
  heroSubtitle!: string;

  @Column({
    name: 'footer_message',
    type: 'varchar',
    length: 400,
    default:
      'Portal público de consulta e download de documentos. Alguns arquivos exigem um cadastro rápido antes do download.',
  })
  footerMessage!: string;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
