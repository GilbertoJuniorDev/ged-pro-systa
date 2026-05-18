import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTableNamesToEnglish1746500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "permissoes"          RENAME TO "permissions"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "modulos"             RENAME TO "modules"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "pessoa_fisicas"      RENAME TO "physical_persons"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "enderecos"           RENAME TO "addresses"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "telefones"           RENAME TO "phones"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "usuario_permissoes" RENAME TO "user_permissions"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS "user_permissions" RENAME TO "usuario_permissoes"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "phones"           RENAME TO "telefones"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "addresses"        RENAME TO "enderecos"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "physical_persons" RENAME TO "pessoa_fisicas"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "modules"          RENAME TO "modulos"`);
    await queryRunner.query(`ALTER TABLE IF EXISTS "permissions"      RENAME TO "permissoes"`);
  }
}
