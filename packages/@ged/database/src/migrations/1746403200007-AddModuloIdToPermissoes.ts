import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModuloIdToPermissoes1746403200007 implements MigrationInterface {
  name = 'AddModuloIdToPermissoes1746403200007';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "permissoes" ADD COLUMN IF NOT EXISTS "modulo_id" UUID
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "permissoes"
          ADD CONSTRAINT "FK_permissoes_modulo_id"
          FOREIGN KEY ("modulo_id") REFERENCES "modulos" ("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "permissoes"
        DROP CONSTRAINT IF EXISTS "FK_permissoes_modulo_id",
        DROP COLUMN IF EXISTS "modulo_id"
    `);
  }
}
