import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPortalFieldsToDocuments1782950400007 implements MigrationInterface {
  name = 'AddPortalFieldsToDocuments1782950400007';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "documents"
        ADD COLUMN IF NOT EXISTS "destaque"        BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "exige_cadastro"   BOOLEAN NOT NULL DEFAULT false
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN IF EXISTS "exige_cadastro"`);
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN IF EXISTS "destaque"`);
  }
}
