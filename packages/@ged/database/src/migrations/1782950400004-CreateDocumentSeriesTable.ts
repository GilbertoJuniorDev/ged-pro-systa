import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentSeriesTable1782950400004 implements MigrationInterface {
  name = 'CreateDocumentSeriesTable1782950400004';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "document_series_destinacao_final_enum" AS ENUM ('GUARDA_PERMANENTE', 'ELIMINACAO');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "document_series" (
        "id"                         UUID                                        NOT NULL DEFAULT gen_random_uuid(),
        "codigo"                     VARCHAR                                     NOT NULL,
        "nome"                       VARCHAR                                     NOT NULL,
        "descricao"                  VARCHAR,
        "prazo_corrente_meses"       INTEGER                                     NOT NULL,
        "prazo_intermediario_meses"  INTEGER                                     NOT NULL,
        "destinacao_final"           "document_series_destinacao_final_enum"    NOT NULL,
        "base_legal"                 TEXT,
        "is_active"                  BOOLEAN                                     NOT NULL DEFAULT true,
        "departamento_id"            UUID                                        NOT NULL,
        "serie_pai_id"               UUID,
        "created_at"                 TIMESTAMP                                   NOT NULL DEFAULT now(),
        "updated_at"                 TIMESTAMP                                   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_document_series_id"                    PRIMARY KEY ("id"),
        CONSTRAINT "UQ_document_series_departamento_codigo"   UNIQUE ("departamento_id", "codigo"),
        CONSTRAINT "FK_document_series_departamento_id"       FOREIGN KEY ("departamento_id")
          REFERENCES "departments" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_document_series_serie_pai_id"          FOREIGN KEY ("serie_pai_id")
          REFERENCES "document_series" ("id") ON DELETE SET NULL
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "document_series"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "document_series_destinacao_final_enum"`);
  }
}
