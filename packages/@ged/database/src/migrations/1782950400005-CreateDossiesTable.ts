import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDossiesTable1782950400005 implements MigrationInterface {
  name = 'CreateDossiesTable1782950400005';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dossies" (
        "id"              UUID      NOT NULL DEFAULT gen_random_uuid(),
        "nome"            VARCHAR   NOT NULL,
        "descricao"       VARCHAR,
        "is_active"       BOOLEAN   NOT NULL DEFAULT true,
        "departamento_id" UUID      NOT NULL,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dossies_id"              PRIMARY KEY ("id"),
        CONSTRAINT "FK_dossies_departamento_id" FOREIGN KEY ("departamento_id")
          REFERENCES "departments" ("id") ON DELETE RESTRICT
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "dossies"`);
  }
}
