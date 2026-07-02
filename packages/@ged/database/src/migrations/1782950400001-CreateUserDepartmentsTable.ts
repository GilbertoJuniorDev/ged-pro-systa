import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserDepartmentsTable1782950400001 implements MigrationInterface {
  name = 'CreateUserDepartmentsTable1782950400001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_departments" (
        "id"              UUID      NOT NULL DEFAULT gen_random_uuid(),
        "usuario_id"      UUID      NOT NULL,
        "departamento_id" UUID      NOT NULL,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_departments_id"                    PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_departments_usuario_departamento"  UNIQUE ("usuario_id", "departamento_id"),
        CONSTRAINT "FK_user_departments_usuario_id"            FOREIGN KEY ("usuario_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_departments_departamento_id"       FOREIGN KEY ("departamento_id")
          REFERENCES "departments" ("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_departments"`);
  }
}
