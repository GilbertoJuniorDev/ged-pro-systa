import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentAccessGrantsTable1782950400010 implements MigrationInterface {
  name = 'CreateDocumentAccessGrantsTable1782950400010';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "document_access_departments" (
        "id"              UUID      NOT NULL DEFAULT gen_random_uuid(),
        "document_id"     UUID      NOT NULL,
        "departamento_id" UUID      NOT NULL,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_document_access_departments_id"          PRIMARY KEY ("id"),
        CONSTRAINT "UQ_document_access_departments_doc_dept"    UNIQUE ("document_id", "departamento_id"),
        CONSTRAINT "FK_document_access_departments_document_id" FOREIGN KEY ("document_id")
          REFERENCES "documents" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_document_access_departments_dept_id"     FOREIGN KEY ("departamento_id")
          REFERENCES "departments" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_document_access_departments_document_id" ON "document_access_departments" ("document_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "document_access_users" (
        "id"          UUID      NOT NULL DEFAULT gen_random_uuid(),
        "document_id" UUID      NOT NULL,
        "usuario_id"  UUID      NOT NULL,
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_document_access_users_id"          PRIMARY KEY ("id"),
        CONSTRAINT "UQ_document_access_users_doc_user"    UNIQUE ("document_id", "usuario_id"),
        CONSTRAINT "FK_document_access_users_document_id" FOREIGN KEY ("document_id")
          REFERENCES "documents" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_document_access_users_usuario_id"  FOREIGN KEY ("usuario_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_document_access_users_document_id" ON "document_access_users" ("document_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "document_access_users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "document_access_departments"`);
  }
}
