import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveInternoConfidencialidade1782950400009 implements MigrationInterface {
  name = 'RemoveInternoConfidencialidade1782950400009';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Postgres não permite remover um valor de um tipo ENUM diretamente — é preciso
    // migrar os dados, recriar o tipo sem o valor e trocar a coluna para o novo tipo.
    await queryRunner.query(`
      UPDATE "documents" SET "confidencialidade" = 'RESTRITO' WHERE "confidencialidade" = 'INTERNO'
    `);

    await queryRunner.query(`ALTER TABLE "documents" ALTER COLUMN "confidencialidade" DROP DEFAULT`);
    await queryRunner.query(`ALTER TYPE "documents_confidencialidade_enum" RENAME TO "documents_confidencialidade_enum_old"`);
    await queryRunner.query(`CREATE TYPE "documents_confidencialidade_enum" AS ENUM ('PUBLICO', 'RESTRITO', 'CONFIDENCIAL')`);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ALTER COLUMN "confidencialidade" TYPE "documents_confidencialidade_enum"
      USING "confidencialidade"::text::"documents_confidencialidade_enum"
    `);
    await queryRunner.query(`ALTER TABLE "documents" ALTER COLUMN "confidencialidade" SET DEFAULT 'RESTRITO'`);
    await queryRunner.query(`DROP TYPE "documents_confidencialidade_enum_old"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "documents" ALTER COLUMN "confidencialidade" DROP DEFAULT`);
    await queryRunner.query(`ALTER TYPE "documents_confidencialidade_enum" RENAME TO "documents_confidencialidade_enum_old"`);
    await queryRunner.query(`CREATE TYPE "documents_confidencialidade_enum" AS ENUM ('PUBLICO', 'INTERNO', 'RESTRITO', 'CONFIDENCIAL')`);
    await queryRunner.query(`
      ALTER TABLE "documents"
      ALTER COLUMN "confidencialidade" TYPE "documents_confidencialidade_enum"
      USING "confidencialidade"::text::"documents_confidencialidade_enum"
    `);
    await queryRunner.query(`ALTER TABLE "documents" ALTER COLUMN "confidencialidade" SET DEFAULT 'INTERNO'`);
    await queryRunner.query(`DROP TYPE "documents_confidencialidade_enum_old"`);
  }
}
