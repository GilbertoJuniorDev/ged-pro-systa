import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSystemSettingsTable1747200000000
  implements MigrationInterface
{
  name = 'CreateSystemSettingsTable1747200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "key"         VARCHAR(100) NOT NULL,
        "value"       TEXT,
        "description" VARCHAR,
        "updated_at"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_system_settings" PRIMARY KEY ("key")
      )
    `);

    // Seed: e-mail de alerta de erros críticos (vazio por padrão)
    await queryRunner.query(`
      INSERT INTO "system_settings" ("key", "value", "description")
      VALUES (
        'error_alert_email',
        NULL,
        'E-mail que recebe alertas automáticos de erros críticos (5xx / fatal)'
      )
      ON CONFLICT ("key") DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "system_settings"`);
  }
}
