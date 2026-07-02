import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDepartmentsTable1782950400000 implements MigrationInterface {
  name = 'CreateDepartmentsTable1782950400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "departments" (
        "id"         UUID      NOT NULL DEFAULT gen_random_uuid(),
        "nome"       VARCHAR   NOT NULL,
        "descricao"  VARCHAR,
        "is_active"  BOOLEAN   NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_departments_id"   PRIMARY KEY ("id"),
        CONSTRAINT "UQ_departments_nome" UNIQUE ("nome")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "departments"`);
  }
}
