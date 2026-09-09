import type { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeDocumentClassificationOptional1782950400014 implements MigrationInterface {
  name = 'MakeDocumentClassificationOptional1782950400014';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "documents" ALTER COLUMN "departamento_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "documents" ALTER COLUMN "serie_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "criado_por" UUID`);
    await queryRunner.query(`
      ALTER TABLE "documents" ADD CONSTRAINT "FK_documents_criado_por"
        FOREIGN KEY ("criado_por") REFERENCES "users" ("id") ON DELETE SET NULL
    `);
    // Suporta o ramo de acesso "documento não classificado" avaliado em toda
    // listagem de documentos e no dashboard (ver access-scope.ts).
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_documents_criado_por_nao_classificados"
        ON "documents" ("criado_por") WHERE "departamento_id" IS NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_criado_por_nao_classificados"`);
    await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "FK_documents_criado_por"`);
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN IF EXISTS "criado_por"`);
    // Falha de propósito se existirem documentos não classificados — o revert exige
    // classificá-los ou removê-los antes (não há default seguro a inventar aqui).
    await queryRunner.query(`ALTER TABLE "documents" ALTER COLUMN "serie_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "documents" ALTER COLUMN "departamento_id" SET NOT NULL`);
  }
}
