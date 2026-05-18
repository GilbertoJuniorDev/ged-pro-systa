import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyRelationsAndCnae1746700000000 implements MigrationInterface {
  name = 'AddCompanyRelationsAndCnae1746700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // ── company: novos campos cadastrais + remover email/telefone ───
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN IF EXISTS "email"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN IF EXISTS "telefone"`);

    await queryRunner.query(`ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "nome_empresarial"            VARCHAR`);
    await queryRunner.query(`ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "matriz"                      BOOLEAN NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "data_abertura"               DATE`);
    await queryRunner.query(`ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "porte"                       VARCHAR`);
    await queryRunner.query(`ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "natureza_juridica_codigo"    VARCHAR`);
    await queryRunner.query(`ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "natureza_juridica_descricao" VARCHAR`);
    await queryRunner.query(`ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "situacao_cadastral"          VARCHAR`);
    await queryRunner.query(`ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "situacao_cadastral_data"     DATE`);

    // ── addresses: torna pessoa_fisica_id nullable + adiciona company_id ──
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "pessoa_fisica_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "addresses" ADD COLUMN IF NOT EXISTS "company_id" UUID`);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "addresses"
        ADD CONSTRAINT "FK_addresses_company"
        FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "addresses"
        ADD CONSTRAINT "CK_addresses_owner_xor"
        CHECK (
          (("pessoa_fisica_id" IS NOT NULL)::int + ("company_id" IS NOT NULL)::int) = 1
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_addresses_company_id" ON "addresses" ("company_id")`);

    // ── phones: torna pessoa_fisica_id nullable + adiciona company_id ──
    await queryRunner.query(`ALTER TABLE "phones" ALTER COLUMN "pessoa_fisica_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "phones" ADD COLUMN IF NOT EXISTS "company_id" UUID`);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "phones"
        ADD CONSTRAINT "FK_phones_company"
        FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "phones"
        ADD CONSTRAINT "CK_phones_owner_xor"
        CHECK (
          (("pessoa_fisica_id" IS NOT NULL)::int + ("company_id" IS NOT NULL)::int) = 1
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_phones_company_id" ON "phones" ("company_id")`);

    // ── emails (nova tabela polimórfica) ──────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "email_type_enum" AS ENUM ('PRINCIPAL', 'FINANCEIRO', 'COMERCIAL', 'OUTRO');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "emails" (
        "id"               UUID              NOT NULL DEFAULT gen_random_uuid(),
        "pessoa_fisica_id" UUID,
        "company_id"       UUID,
        "tipo"             "email_type_enum" NOT NULL DEFAULT 'PRINCIPAL',
        "endereco"         VARCHAR(255)      NOT NULL,
        "created_at"       TIMESTAMP         NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_emails_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_emails_physical_person"
          FOREIGN KEY ("pessoa_fisica_id") REFERENCES "physical_persons"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_emails_company"
          FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE,
        CONSTRAINT "CK_emails_owner_xor"
          CHECK ((("pessoa_fisica_id" IS NOT NULL)::int + ("company_id" IS NOT NULL)::int) = 1)
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_emails_pessoa_fisica_id" ON "emails" ("pessoa_fisica_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_emails_company_id"       ON "emails" ("company_id")`);

    // ── cnaes (nova tabela) ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cnaes" (
        "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
        "company_id" UUID         NOT NULL,
        "codigo"     VARCHAR(7)   NOT NULL,
        "descricao"  VARCHAR(255) NOT NULL,
        "principal"  BOOLEAN      NOT NULL DEFAULT false,
        "created_at" TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cnaes_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cnaes_company"
          FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_cnaes_company_codigo" ON "cnaes" ("company_id", "codigo")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_cnaes_company_principal"
         ON "cnaes" ("company_id") WHERE "principal" = true`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // cnaes
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_cnaes_company_principal"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_cnaes_company_codigo"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cnaes"`);

    // emails
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_emails_company_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_emails_pessoa_fisica_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "emails"`);
    await queryRunner.query(`DROP TYPE  IF EXISTS "email_type_enum"`);

    // phones
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_phones_company_id"`);
    await queryRunner.query(`ALTER TABLE "phones" DROP CONSTRAINT IF EXISTS "CK_phones_owner_xor"`);
    await queryRunner.query(`ALTER TABLE "phones" DROP CONSTRAINT IF EXISTS "FK_phones_company"`);
    await queryRunner.query(`ALTER TABLE "phones" DROP COLUMN IF EXISTS "company_id"`);
    await queryRunner.query(`ALTER TABLE "phones" ALTER COLUMN "pessoa_fisica_id" SET NOT NULL`);

    // addresses
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_addresses_company_id"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT IF EXISTS "CK_addresses_owner_xor"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT IF EXISTS "FK_addresses_company"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN IF EXISTS "company_id"`);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "pessoa_fisica_id" SET NOT NULL`);

    // company
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN IF EXISTS "situacao_cadastral_data"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN IF EXISTS "situacao_cadastral"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN IF EXISTS "natureza_juridica_descricao"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN IF EXISTS "natureza_juridica_codigo"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN IF EXISTS "porte"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN IF EXISTS "data_abertura"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN IF EXISTS "matriz"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN IF EXISTS "nome_empresarial"`);
    await queryRunner.query(`ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "email" VARCHAR`);
    await queryRunner.query(`ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "telefone" VARCHAR`);
  }
}
