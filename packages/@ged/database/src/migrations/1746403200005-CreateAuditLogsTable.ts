import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1746403200005 implements MigrationInterface {
  name = 'CreateAuditLogsTable1746403200005';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id"          UUID      NOT NULL DEFAULT gen_random_uuid(),
        "usuario_id"  UUID,
        "acao"        VARCHAR   NOT NULL,
        "entidade"    VARCHAR,
        "entidade_id" VARCHAR,
        "ip_cliente"  VARCHAR,
        "user_agent"  VARCHAR,
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id"         PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_usuario_id" FOREIGN KEY ("usuario_id")
          REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_usuario_id"  ON "audit_logs" ("usuario_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_entidade"    ON "audit_logs" ("entidade")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_created_at"  ON "audit_logs" ("created_at")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_entidade"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_usuario_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
