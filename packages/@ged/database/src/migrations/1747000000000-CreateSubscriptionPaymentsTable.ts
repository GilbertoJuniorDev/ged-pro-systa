import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionPaymentsTable1747000000000
  implements MigrationInterface
{
  name = 'CreateSubscriptionPaymentsTable1747000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscription_payments" (
        "id"                  UUID NOT NULL DEFAULT gen_random_uuid(),
        "subscription_id"     UUID NOT NULL,
        "paid_at"             DATE NOT NULL,
        "next_billing_date"   DATE,
        "valor"               DECIMAL(10, 2) NOT NULL,
        "notes"               TEXT,
        "created_at"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscription_payments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscription_payments_subscription"
          FOREIGN KEY ("subscription_id")
          REFERENCES "subscription"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_payments_subscription_id"
       ON "subscription_payments" ("subscription_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_subscription_payments_paid_at"
       ON "subscription_payments" ("paid_at" DESC)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_payments"`);
  }
}
