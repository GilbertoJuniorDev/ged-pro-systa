import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArquivosTables1782950400012 implements MigrationInterface {
  name = 'CreateArquivosTables1782950400012';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "arquivos_status_enum" AS ENUM ('ABERTO', 'FECHADO');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "arquivos" (
        "id"                  UUID                     NOT NULL DEFAULT gen_random_uuid(),
        "codigo"              VARCHAR                  NOT NULL,
        "ano"                 INTEGER                  NOT NULL,
        "sequencia"           INTEGER                  NOT NULL,
        "nome"                VARCHAR                  NOT NULL,
        "descricao"           VARCHAR,
        "status"              "arquivos_status_enum"   NOT NULL DEFAULT 'ABERTO',
        "data_encerramento"   TIMESTAMP,
        "encerrado_por_id"    UUID,
        "predio"              VARCHAR,
        "sala"                VARCHAR,
        "estante"             VARCHAR,
        "prateleira"          VARCHAR,
        "caixa"               VARCHAR,
        "departamento_id"     UUID                     NOT NULL,
        "created_at"          TIMESTAMP                NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMP                NOT NULL DEFAULT now(),
        CONSTRAINT "PK_arquivos_id"                          PRIMARY KEY ("id"),
        CONSTRAINT "UQ_arquivos_departamento_ano_sequencia"  UNIQUE ("departamento_id", "ano", "sequencia"),
        CONSTRAINT "FK_arquivos_departamento_id"             FOREIGN KEY ("departamento_id")
          REFERENCES "departments" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_arquivos_encerrado_por_id"            FOREIGN KEY ("encerrado_por_id")
          REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_arquivos_codigo" ON "arquivos" ("codigo")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_arquivos_status" ON "arquivos" ("status")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "arquivo_departments" (
        "id"              UUID      NOT NULL DEFAULT gen_random_uuid(),
        "arquivo_id"      UUID      NOT NULL,
        "departamento_id" UUID      NOT NULL,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_arquivo_departments_id"                 PRIMARY KEY ("id"),
        CONSTRAINT "UQ_arquivo_departments_arquivo_departamento" UNIQUE ("arquivo_id", "departamento_id"),
        CONSTRAINT "FK_arquivo_departments_arquivo_id"         FOREIGN KEY ("arquivo_id")
          REFERENCES "arquivos" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_arquivo_departments_departamento_id"    FOREIGN KEY ("departamento_id")
          REFERENCES "departments" ("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "arquivo_departments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "arquivos"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "arquivos_status_enum"`);
  }
}
