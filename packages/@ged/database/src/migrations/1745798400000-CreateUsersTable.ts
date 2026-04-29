import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1745798400000 implements MigrationInterface {
  name = 'CreateUsersTable1745798400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('ADMIN', 'MANAGER', 'VIEWER')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            UUID              NOT NULL DEFAULT gen_random_uuid(),
        "name"          VARCHAR           NOT NULL,
        "email"         VARCHAR           NOT NULL,
        "password_hash" VARCHAR           NOT NULL,
        "role"          "users_role_enum" NOT NULL DEFAULT 'VIEWER',
        "is_active"     BOOLEAN           NOT NULL DEFAULT true,
        "created_at"    TIMESTAMP         NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id"     PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
