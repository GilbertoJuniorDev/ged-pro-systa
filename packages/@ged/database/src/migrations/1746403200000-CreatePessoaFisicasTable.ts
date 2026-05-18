import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePessoaFisicasTable1746403200000 implements MigrationInterface {
  name = 'CreatePessoaFisicasTable1746403200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "pessoa_fisicas_sexo_enum" AS ENUM ('M', 'F', 'O');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pessoa_fisicas" (
        "id"              UUID                        NOT NULL DEFAULT gen_random_uuid(),
        "user_id"         UUID                        NOT NULL,
        "nome"            VARCHAR                     NOT NULL,
        "sobrenome"       VARCHAR                     NOT NULL,
        "cpf"             VARCHAR(11)                 NOT NULL,
        "data_nascimento" DATE                        NOT NULL,
        "sexo"            "pessoa_fisicas_sexo_enum"  NOT NULL,
        "created_at"      TIMESTAMP                   NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP                   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pessoa_fisicas_id"       PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pessoa_fisicas_user_id"  UNIQUE ("user_id"),
        CONSTRAINT "UQ_pessoa_fisicas_cpf"      UNIQUE ("cpf"),
        CONSTRAINT "FK_pessoa_fisicas_user_id"  FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "pessoa_fisicas"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "pessoa_fisicas_sexo_enum"`);
  }
}
