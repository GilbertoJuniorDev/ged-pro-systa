import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiffColumnsToAuditLogs1748200000000 implements MigrationInterface {
  name = 'AddDiffColumnsToAuditLogs1748200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
        ADD COLUMN IF NOT EXISTS "dados_anteriores" JSONB,
        ADD COLUMN IF NOT EXISTS "dados_novos"      JSONB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "dados_novos"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "dados_anteriores"`);
  }
}
