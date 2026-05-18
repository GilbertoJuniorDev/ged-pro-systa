import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateModulosTable1746403200006 implements MigrationInterface {
  name = 'CreateModulosTable1746403200006';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "modulos" (
        "id"         UUID      NOT NULL DEFAULT gen_random_uuid(),
        "nome"       VARCHAR   NOT NULL,
        "slug"       VARCHAR   NOT NULL,
        "descricao"  VARCHAR,
        "icone"      VARCHAR,
        "ordem"      INT       NOT NULL DEFAULT 0,
        "is_active"  BOOLEAN   NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_modulos_id"   PRIMARY KEY ("id"),
        CONSTRAINT "UQ_modulos_nome" UNIQUE ("nome"),
        CONSTRAINT "UQ_modulos_slug" UNIQUE ("slug")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "modulos"`);
  }
}
