import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuperAdminToUsersRoleEnum1782950400002 implements MigrationInterface {
  name = 'AddSuperAdminToUsersRoleEnum1782950400002';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Postgres não permite usar (ler ou escrever) um valor de enum recém-adicionado
    // na mesma transação em que ele foi criado. Esta migration deve conter APENAS
    // este ALTER TYPE — nenhuma outra migration do mesmo lote de transação pode
    // referenciar 'SUPER_ADMIN'.
    await queryRunner.query(`ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN'`);
  }

  async down(): Promise<void> {
    // Postgres não permite remover um valor de enum diretamente (exigiria recriar
    // o tipo, migrar a coluna e todas as dependências). Rollback fica a cargo de
    // intervenção manual do DBA caso necessário.
  }
}
