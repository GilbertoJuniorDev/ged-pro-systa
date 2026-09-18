import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUseDefaultThemeToAppearance1782950400016 implements MigrationInterface {
  name = 'AddUseDefaultThemeToAppearance1782950400016';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Default tem que ser `false`, nunca `true`: se nascesse `true`, o ADD COLUMN
    // marcaria retroativamente a única linha de QUALQUER instalação já em produção
    // como "usar padrão", trocando silenciosamente as cores customizadas de qualquer
    // cliente já em produção assim que a migration rodasse.
    await queryRunner.query(`
      ALTER TABLE "appearance_settings" ADD COLUMN IF NOT EXISTS "use_default_theme" BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE "portal_appearances"  ADD COLUMN IF NOT EXISTS "use_default_theme" BOOLEAN NOT NULL DEFAULT false;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "portal_appearances" DROP COLUMN IF EXISTS "use_default_theme"`);
    await queryRunner.query(`ALTER TABLE "appearance_settings" DROP COLUMN IF EXISTS "use_default_theme"`);
  }
}
