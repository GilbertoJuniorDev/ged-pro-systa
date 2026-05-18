import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTelefonesTable1746403200002 implements MigrationInterface {
  name = 'CreateTelefonesTable1746403200002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "telefones_tipo_enum" AS ENUM ('CELULAR', 'RESIDENCIAL', 'COMERCIAL');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "telefones" (
        "id"               UUID                    NOT NULL DEFAULT gen_random_uuid(),
        "pessoa_fisica_id" UUID                    NOT NULL,
        "tipo"             "telefones_tipo_enum"   NOT NULL DEFAULT 'CELULAR',
        "numero"           VARCHAR                 NOT NULL,
        "created_at"       TIMESTAMP               NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP               NOT NULL DEFAULT now(),
        CONSTRAINT "PK_telefones_id"               PRIMARY KEY ("id"),
        CONSTRAINT "FK_telefones_pessoa_fisica_id" FOREIGN KEY ("pessoa_fisica_id")
          REFERENCES "pessoa_fisicas" ("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "telefones"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "telefones_tipo_enum"`);
  }
}
