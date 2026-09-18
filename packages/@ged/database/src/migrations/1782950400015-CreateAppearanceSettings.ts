import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppearanceSettings1782950400015 implements MigrationInterface {
  name = 'CreateAppearanceSettings1782950400015';

  async up(queryRunner: QueryRunner): Promise<void> {
    // ── appearance_settings (singleton) — tema do sistema (área admin) ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appearance_settings" (
        "id"               UUID        NOT NULL DEFAULT gen_random_uuid(),
        "primary_color"    VARCHAR(7)  NOT NULL DEFAULT '#4f46e5',
        "secondary_color"  VARCHAR(7)  NOT NULL DEFAULT '#0ea5e9',
        "background_color" VARCHAR(7)  NOT NULL DEFAULT '#0f172a',
        "logo_path"        VARCHAR,
        "logo_mime_type"   VARCHAR,
        "logo_version"     INTEGER     NOT NULL DEFAULT 0,
        "singleton"        CHAR(1)     NOT NULL DEFAULT 'X',
        "created_at"       TIMESTAMP   NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appearance_settings_id"        PRIMARY KEY ("id"),
        CONSTRAINT "UQ_appearance_settings_singleton" UNIQUE ("singleton"),
        CONSTRAINT "CK_appearance_settings_singleton" CHECK ("singleton" = 'X')
      )
    `);

    await queryRunner.query(`
      INSERT INTO "appearance_settings" DEFAULT VALUES
    `);

    // ── portal_appearances (singleton) — tema do portal público ─────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "portal_appearances" (
        "id"               UUID        NOT NULL DEFAULT gen_random_uuid(),
        "primary_color"    VARCHAR(7)  NOT NULL DEFAULT '#4f46e5',
        "secondary_color"  VARCHAR(7)  NOT NULL DEFAULT '#0ea5e9',
        "background_color" VARCHAR(7)  NOT NULL DEFAULT '#f8fafc',
        "logo_path"        VARCHAR,
        "logo_mime_type"   VARCHAR,
        "logo_version"     INTEGER     NOT NULL DEFAULT 0,
        "hero_title"       VARCHAR(200) NOT NULL DEFAULT 'Portal de Documentos Públicos',
        "hero_subtitle"    VARCHAR(400) NOT NULL DEFAULT 'Consulte e baixe documentos disponibilizados publicamente. Busque por nome, filtre por série e acesse o conteúdo em poucos cliques.',
        "footer_message"   VARCHAR(400) NOT NULL DEFAULT 'Portal público de consulta e download de documentos. Alguns arquivos exigem um cadastro rápido antes do download.',
        "singleton"        CHAR(1)     NOT NULL DEFAULT 'X',
        "created_at"       TIMESTAMP   NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_portal_appearances_id"        PRIMARY KEY ("id"),
        CONSTRAINT "UQ_portal_appearances_singleton" UNIQUE ("singleton"),
        CONSTRAINT "CK_portal_appearances_singleton" CHECK ("singleton" = 'X')
      )
    `);

    await queryRunner.query(`
      INSERT INTO "portal_appearances" DEFAULT VALUES
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "portal_appearances"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appearance_settings"`);
  }
}
