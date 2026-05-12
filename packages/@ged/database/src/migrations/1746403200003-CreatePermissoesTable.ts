import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePermissoesTable1746403200003 implements MigrationInterface {
  name = 'CreatePermissoesTable1746403200003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "permissoes" (
        "id"         UUID      NOT NULL DEFAULT gen_random_uuid(),
        "nome"       VARCHAR   NOT NULL,
        "descricao"  VARCHAR,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permissoes_id"   PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permissoes_nome" UNIQUE ("nome")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "permissoes"`);
  }
}
