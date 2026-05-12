import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnderecosTable1746403200001 implements MigrationInterface {
  name = 'CreateEnderecosTable1746403200001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "enderecos_tipo_enum" AS ENUM ('RESIDENCIAL', 'COMERCIAL', 'OUTRO')
    `);

    await queryRunner.query(`
      CREATE TABLE "enderecos" (
        "id"               UUID                    NOT NULL DEFAULT gen_random_uuid(),
        "pessoa_fisica_id" UUID                    NOT NULL,
        "tipo"             "enderecos_tipo_enum"   NOT NULL DEFAULT 'RESIDENCIAL',
        "logradouro"       VARCHAR                 NOT NULL,
        "numero"           VARCHAR                 NOT NULL,
        "complemento"      VARCHAR,
        "bairro"           VARCHAR                 NOT NULL,
        "cidade"           VARCHAR                 NOT NULL,
        "estado"           VARCHAR(2)              NOT NULL,
        "cep"              VARCHAR(8)              NOT NULL,
        "created_at"       TIMESTAMP               NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP               NOT NULL DEFAULT now(),
        CONSTRAINT "PK_enderecos_id"                    PRIMARY KEY ("id"),
        CONSTRAINT "FK_enderecos_pessoa_fisica_id"      FOREIGN KEY ("pessoa_fisica_id")
          REFERENCES "pessoa_fisicas" ("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "enderecos"`);
    await queryRunner.query(`DROP TYPE "enderecos_tipo_enum"`);
  }
}
