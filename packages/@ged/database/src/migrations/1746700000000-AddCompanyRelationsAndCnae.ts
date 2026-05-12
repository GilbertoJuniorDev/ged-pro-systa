import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyRelationsAndCnae1746700000000 implements MigrationInterface {
  name = 'AddCompanyRelationsAndCnae1746700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // ── company: novos campos cadastrais + remover email/telefone ───
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "telefone"`);

    await queryRunner.query(`ALTER TABLE "company" ADD "nome_empresarial"            VARCHAR`);
    await queryRunner.query(`ALTER TABLE "company" ADD "matriz"                      BOOLEAN NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "company" ADD "data_abertura"               DATE`);
    await queryRunner.query(`ALTER TABLE "company" ADD "porte"                       VARCHAR`);
    await queryRunner.query(`ALTER TABLE "company" ADD "natureza_juridica_codigo"    VARCHAR`);
    await queryRunner.query(`ALTER TABLE "company" ADD "natureza_juridica_descricao" VARCHAR`);
    await queryRunner.query(`ALTER TABLE "company" ADD "situacao_cadastral"          VARCHAR`);
    await queryRunner.query(`ALTER TABLE "company" ADD "situacao_cadastral_data"     DATE`);

    // ── addresses: torna pessoa_fisica_id nullable + adiciona company_id ──
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "pessoa_fisica_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "addresses" ADD "company_id" UUID`);
    await queryRunner.query(`
      ALTER TABLE "addresses"
      ADD CONSTRAINT "FK_addresses_company"
      FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "addresses"
      ADD CONSTRAINT "CK_addresses_owner_xor"
      CHECK (
        (("pessoa_fisica_id" IS NOT NULL)::int + ("company_id" IS NOT NULL)::int) = 1
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_addresses_company_id" ON "addresses" ("company_id")`);

    // ── phones: torna pessoa_fisica_id nullable + adiciona company_id ──
    await queryRunner.query(`ALTER TABLE "phones" ALTER COLUMN "pessoa_fisica_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "phones" ADD "company_id" UUID`);
    await queryRunner.query(`
      ALTER TABLE "phones"
      ADD CONSTRAINT "FK_phones_company"
      FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "phones"
      ADD CONSTRAINT "CK_phones_owner_xor"
      CHECK (
        (("pessoa_fisica_id" IS NOT NULL)::int + ("company_id" IS NOT NULL)::int) = 1
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_phones_company_id" ON "phones" ("company_id")`);

    // ── emails (nova tabela polimórfica) ──────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "email_type_enum" AS ENUM ('PRINCIPAL', 'FINANCEIRO', 'COMERCIAL', 'OUTRO')
    `);
    await queryRunner.query(`
      CREATE TABLE "emails" (
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
    await queryRunner.query(`CREATE INDEX "IDX_emails_pessoa_fisica_id" ON "emails" ("pessoa_fisica_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_emails_company_id"       ON "emails" ("company_id")`);

    // ── cnaes (nova tabela) ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "cnaes" (
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
      `CREATE UNIQUE INDEX "UQ_cnaes_company_codigo" ON "cnaes" ("company_id", "codigo")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_cnaes_company_principal"
         ON "cnaes" ("company_id") WHERE "principal" = true`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // cnaes
    await queryRunner.query(`DROP INDEX "UQ_cnaes_company_principal"`);
    await queryRunner.query(`DROP INDEX "UQ_cnaes_company_codigo"`);
    await queryRunner.query(`DROP TABLE "cnaes"`);

    // emails
    await queryRunner.query(`DROP INDEX "IDX_emails_company_id"`);
    await queryRunner.query(`DROP INDEX "IDX_emails_pessoa_fisica_id"`);
    await queryRunner.query(`DROP TABLE "emails"`);
    await queryRunner.query(`DROP TYPE "email_type_enum"`);

    // phones
    await queryRunner.query(`DROP INDEX "IDX_phones_company_id"`);
    await queryRunner.query(`ALTER TABLE "phones" DROP CONSTRAINT "CK_phones_owner_xor"`);
    await queryRunner.query(`ALTER TABLE "phones" DROP CONSTRAINT "FK_phones_company"`);
    await queryRunner.query(`ALTER TABLE "phones" DROP COLUMN "company_id"`);
    await queryRunner.query(`ALTER TABLE "phones" ALTER COLUMN "pessoa_fisica_id" SET NOT NULL`);

    // addresses
    await queryRunner.query(`DROP INDEX "IDX_addresses_company_id"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "CK_addresses_owner_xor"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_addresses_company"`);
    await queryRunner.query(`ALTER TABLE "addresses" DROP COLUMN "company_id"`);
    await queryRunner.query(`ALTER TABLE "addresses" ALTER COLUMN "pessoa_fisica_id" SET NOT NULL`);

    // company
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "situacao_cadastral_data"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "situacao_cadastral"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "natureza_juridica_descricao"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "natureza_juridica_codigo"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "porte"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "data_abertura"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "matriz"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "nome_empresarial"`);
    await queryRunner.query(`ALTER TABLE "company" ADD "email" VARCHAR`);
    await queryRunner.query(`ALTER TABLE "company" ADD "telefone" VARCHAR`);
  }
}
