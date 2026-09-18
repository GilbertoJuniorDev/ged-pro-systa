import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * AppearanceSetting — singleton entity.
 *
 * Customização visual do sistema (área administrativa autenticada): paleta de
 * cores + logo. Mesmo padrão singleton de `Company` (coluna sentinel `singleton`
 * UNIQUE + CHECK) — projeto é single-tenant, então só existe 1 linha.
 */
@Entity('appearance_settings')
export class AppearanceSetting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'primary_color', type: 'varchar', length: 7, default: '#4f46e5' })
  primaryColor!: string;

  @Column({ name: 'secondary_color', type: 'varchar', length: 7, default: '#0ea5e9' })
  secondaryColor!: string;

  @Column({ name: 'background_color', type: 'varchar', length: 7, default: '#0f172a' })
  backgroundColor!: string;

  @Column({ name: 'logo_path', type: 'varchar', nullable: true })
  logoPath!: string | null;

  @Column({ name: 'logo_mime_type', type: 'varchar', nullable: true })
  logoMimeType!: string | null;

  @Column({ name: 'logo_version', type: 'int', default: 0 })
  logoVersion!: number;

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
