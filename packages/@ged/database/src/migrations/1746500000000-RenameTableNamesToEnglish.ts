import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTableNamesToEnglish1746500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('permissoes', 'permissions');
    await queryRunner.renameTable('modulos', 'modules');
    await queryRunner.renameTable('pessoa_fisicas', 'physical_persons');
    await queryRunner.renameTable('enderecos', 'addresses');
    await queryRunner.renameTable('telefones', 'phones');
    await queryRunner.renameTable('usuario_permissoes', 'user_permissions');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('user_permissions', 'usuario_permissoes');
    await queryRunner.renameTable('phones', 'telefones');
    await queryRunner.renameTable('addresses', 'enderecos');
    await queryRunner.renameTable('physical_persons', 'pessoa_fisicas');
    await queryRunner.renameTable('modules', 'modulos');
    await queryRunner.renameTable('permissions', 'permissoes');
  }
}
