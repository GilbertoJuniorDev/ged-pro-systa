import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArquivoIdToDossies1782950400013 implements MigrationInterface {
  name = 'AddArquivoIdToDossies1782950400013';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "dossies" ADD COLUMN IF NOT EXISTS "arquivo_id" UUID
    `);
    await queryRunner.query(`
      ALTER TABLE "dossies" ADD CONSTRAINT "FK_dossies_arquivo_id"
        FOREIGN KEY ("arquivo_id") REFERENCES "arquivos" ("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_dossies_arquivo_id" ON "dossies" ("arquivo_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_dossies_arquivo_id"`);
    await queryRunner.query(`ALTER TABLE "dossies" DROP CONSTRAINT IF EXISTS "FK_dossies_arquivo_id"`);
    await queryRunner.query(`ALTER TABLE "dossies" DROP COLUMN IF EXISTS "arquivo_id"`);
  }
}
