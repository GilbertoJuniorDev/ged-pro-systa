import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentsTable1782950400006 implements MigrationInterface {
  name = 'CreateDocumentsTable1782950400006';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "documents_confidencialidade_enum" AS ENUM ('PUBLICO', 'INTERNO', 'RESTRITO', 'CONFIDENCIAL');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "documents_fase_enum" AS ENUM ('CORRENTE', 'INTERMEDIARIO');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id"                         UUID                                  NOT NULL DEFAULT gen_random_uuid(),
        "nome"                       VARCHAR                               NOT NULL,
        "descricao"                  VARCHAR,
        "validade"                   DATE,
        "confidencialidade"          "documents_confidencialidade_enum"    NOT NULL DEFAULT 'INTERNO',
        "departamento_id"            UUID                                  NOT NULL,
        "serie_id"                   UUID                                  NOT NULL,
        "dossie_id"                  UUID,
        "fase"                       "documents_fase_enum"                 NOT NULL DEFAULT 'CORRENTE',
        "fase_corrente_desde"        DATE                                  NOT NULL DEFAULT CURRENT_DATE,
        "fase_intermediario_desde"   DATE,
        "arquivo_nome"               VARCHAR                               NOT NULL,
        "arquivo_chave"              VARCHAR                               NOT NULL,
        "arquivo_mime_type"          VARCHAR                               NOT NULL,
        "arquivo_tamanho"            INTEGER                               NOT NULL,
        "is_active"                  BOOLEAN                               NOT NULL DEFAULT true,
        "created_at"                 TIMESTAMP                             NOT NULL DEFAULT now(),
        "updated_at"                 TIMESTAMP                             NOT NULL DEFAULT now(),
        CONSTRAINT "PK_documents_id"               PRIMARY KEY ("id"),
        CONSTRAINT "FK_documents_departamento_id"  FOREIGN KEY ("departamento_id")
          REFERENCES "departments" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_documents_serie_id"         FOREIGN KEY ("serie_id")
          REFERENCES "document_series" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_documents_dossie_id"        FOREIGN KEY ("dossie_id")
          REFERENCES "dossies" ("id") ON DELETE SET NULL
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "documents_confidencialidade_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "documents_fase_enum"`);
  }
}
