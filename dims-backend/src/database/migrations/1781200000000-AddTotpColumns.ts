import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTotpColumns1781200000000 implements MigrationInterface {
  name = "AddTotpColumns1781200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "totp_secret"  VARCHAR(64)  DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "totp_enabled" BOOLEAN      NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "totp_secret",
        DROP COLUMN IF EXISTS "totp_enabled"
    `);
  }
}
