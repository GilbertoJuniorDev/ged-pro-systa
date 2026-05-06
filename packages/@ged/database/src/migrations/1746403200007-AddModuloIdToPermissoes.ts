import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModuloIdToPermissoes1746403200007 implements MigrationInterface {
  name = 'AddModuloIdToPermissoes1746403200007';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "permissoes"
        ADD COLUMN "modulo_id" UUID,
        ADD CONSTRAINT "FK_permissoes_modulo_id"
          FOREIGN KEY ("modulo_id")
          REFERENCES "modulos" ("id")
          ON DELETE SET NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "permissoes"
        DROP CONSTRAINT "FK_permissoes_modulo_id",
        DROP COLUMN "modulo_id"
    `);
  }
}
