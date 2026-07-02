import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UpgradeSeedAdminToSuperAdmin1782950400003 implements MigrationInterface {
  name = 'UpgradeSeedAdminToSuperAdmin1782950400003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'SUPER_ADMIN' WHERE "email" = 'admin@ged.local' AND "role" = 'ADMIN'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'ADMIN' WHERE "email" = 'admin@ged.local' AND "role" = 'SUPER_ADMIN'`,
    );
  }
}
