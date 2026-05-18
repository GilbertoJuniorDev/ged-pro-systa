import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetTokensTable1746057600000
  implements MigrationInterface
{
  name = 'CreatePasswordResetTokensTable1746057600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id"         UUID      NOT NULL DEFAULT gen_random_uuid(),
        "token_hash" VARCHAR   NOT NULL,
        "user_id"    UUID      NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_tokens_id"         PRIMARY KEY ("id"),
        CONSTRAINT "UQ_password_reset_tokens_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_password_reset_tokens_user_id"
          FOREIGN KEY ("user_id")
          REFERENCES "users" ("id")
          ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
  }
}
