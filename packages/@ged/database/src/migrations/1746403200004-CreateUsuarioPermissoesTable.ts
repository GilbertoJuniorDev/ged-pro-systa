import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsuarioPermissoesTable1746403200004 implements MigrationInterface {
  name = 'CreateUsuarioPermissoesTable1746403200004';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "usuario_permissoes" (
        "id"           UUID      NOT NULL DEFAULT gen_random_uuid(),
        "usuario_id"   UUID      NOT NULL,
        "permissao_id" UUID      NOT NULL,
        "created_at"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_usuario_permissoes_id"                       PRIMARY KEY ("id"),
        CONSTRAINT "UQ_usuario_permissoes_usuario_permissao"        UNIQUE ("usuario_id", "permissao_id"),
        CONSTRAINT "FK_usuario_permissoes_usuario_id"               FOREIGN KEY ("usuario_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_usuario_permissoes_permissao_id"             FOREIGN KEY ("permissao_id")
          REFERENCES "permissoes" ("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "usuario_permissoes"`);
  }
}
