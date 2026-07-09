import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentLeadsTable1782950400008 implements MigrationInterface {
  name = 'CreateDocumentLeadsTable1782950400008';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "document_leads_tipo_documento_enum" AS ENUM ('CPF', 'CNPJ');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "document_leads" (
        "id"              UUID                                  NOT NULL DEFAULT gen_random_uuid(),
        "email"           VARCHAR                               NOT NULL,
        "nome"            VARCHAR                               NOT NULL,
        "documento"       VARCHAR                               NOT NULL,
        "tipo_documento"  "document_leads_tipo_documento_enum"  NOT NULL,
        "document_id"     UUID,
        "ip_cliente"      VARCHAR,
        "user_agent"      VARCHAR,
        "created_at"      TIMESTAMP                             NOT NULL DEFAULT now(),
        CONSTRAINT "PK_document_leads_id"          PRIMARY KEY ("id"),
        CONSTRAINT "FK_document_leads_document_id" FOREIGN KEY ("document_id")
          REFERENCES "documents" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_document_leads_document_id" ON "document_leads" ("document_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_document_leads_created_at" ON "document_leads" ("created_at")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "document_leads"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "document_leads_tipo_documento_enum"`);
  }
}
