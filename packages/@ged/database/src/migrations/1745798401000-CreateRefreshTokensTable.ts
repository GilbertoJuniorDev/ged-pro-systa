import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokensTable1745798401000
  implements MigrationInterface
{
  name = 'CreateRefreshTokensTable1745798401000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id"         UUID      NOT NULL DEFAULT gen_random_uuid(),
        "token"      VARCHAR   NOT NULL,
        "user_id"    UUID      NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens_id"    PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_tokens_token" UNIQUE ("token"),
        CONSTRAINT "FK_refresh_tokens_user_id"
          FOREIGN KEY ("user_id")
          REFERENCES "users" ("id")
          ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
  }
}
