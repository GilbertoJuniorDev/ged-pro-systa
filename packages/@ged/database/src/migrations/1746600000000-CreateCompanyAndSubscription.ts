import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompanyAndSubscription1746600000000 implements MigrationInterface {
  name = 'CreateCompanyAndSubscription1746600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // ── company (singleton) ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company" (
        "id"                  UUID        NOT NULL DEFAULT gen_random_uuid(),
        "cnpj"                VARCHAR(14) NOT NULL,
        "razao_social"        VARCHAR     NOT NULL,
        "nome_fantasia"       VARCHAR,
        "inscricao_estadual"  VARCHAR,
        "email"               VARCHAR,
        "telefone"            VARCHAR,
        "singleton"           CHAR(1)     NOT NULL DEFAULT 'X',
        "created_at"          TIMESTAMP   NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_company_id"        PRIMARY KEY ("id"),
        CONSTRAINT "UQ_company_cnpj"      UNIQUE ("cnpj"),
        CONSTRAINT "UQ_company_singleton" UNIQUE ("singleton"),
        CONSTRAINT "CK_company_singleton" CHECK ("singleton" = 'X')
      )
    `);

    // ── subscription (singleton) ──────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "subscription_status_enum" AS ENUM (
          'ACTIVE', 'SUSPENDED', 'CANCELLED', 'OVERDUE', 'TRIAL'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscription" (
        "id"                  UUID                          NOT NULL DEFAULT gen_random_uuid(),
        "status"              "subscription_status_enum"    NOT NULL DEFAULT 'ACTIVE',
        "plan_name"           VARCHAR,
        "valor"               NUMERIC(10,2)                 NOT NULL DEFAULT 0,
        "start_date"          DATE                          NOT NULL,
        "end_date"            DATE,
        "next_billing_date"   DATE,
        "last_payment_date"   DATE,
        "notes"               TEXT,
        "singleton"           CHAR(1)                       NOT NULL DEFAULT 'X',
        "created_at"          TIMESTAMP                     NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMP                     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscription_id"        PRIMARY KEY ("id"),
        CONSTRAINT "UQ_subscription_singleton" UNIQUE ("singleton"),
        CONSTRAINT "CK_subscription_singleton" CHECK ("singleton" = 'X')
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_status" ON "subscription" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_next_billing_date" ON "subscription" ("next_billing_date")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_next_billing_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription"`);
    await queryRunner.query(`DROP TYPE  IF EXISTS "subscription_status_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company"`);
  }
}
