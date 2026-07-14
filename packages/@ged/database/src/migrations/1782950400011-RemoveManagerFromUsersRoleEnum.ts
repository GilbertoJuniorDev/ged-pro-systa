import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveManagerFromUsersRoleEnum1782950400011 implements MigrationInterface {
  name = 'RemoveManagerFromUsersRoleEnum1782950400011';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Postgres não permite remover um valor de um tipo ENUM diretamente — é preciso
    // migrar os dados, recriar o tipo sem o valor e trocar a coluna para o novo tipo.
    // Usuários MANAGER passam a ser VIEWER (papel comum) — sem concessão automática
    // de permissões; um ADMIN concede manualmente depois, se necessário.
    await queryRunner.query(`
      UPDATE "users" SET "role" = 'VIEWER' WHERE "role" = 'MANAGER'
    `);

    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
    await queryRunner.query(`ALTER TYPE "users_role_enum" RENAME TO "users_role_enum_old"`);
    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('ADMIN', 'VIEWER', 'SUPER_ADMIN')`);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" TYPE "users_role_enum"
      USING "role"::text::"users_role_enum"
    `);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'VIEWER'`);
    await queryRunner.query(`DROP TYPE "users_role_enum_old"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Restaura o tipo com os 4 valores originais. NÃO restaura quais linhas VIEWER
    // eram originalmente MANAGER — essa informação foi perdida no up() (mesma
    // limitação, aceita e documentada, da migration 1782950400009 para INTERNO).
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
    await queryRunner.query(`ALTER TYPE "users_role_enum" RENAME TO "users_role_enum_new"`);
    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('ADMIN', 'MANAGER', 'VIEWER', 'SUPER_ADMIN')`);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" TYPE "users_role_enum"
      USING "role"::text::"users_role_enum"
    `);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'VIEWER'`);
    await queryRunner.query(`DROP TYPE "users_role_enum_new"`);
  }
}
