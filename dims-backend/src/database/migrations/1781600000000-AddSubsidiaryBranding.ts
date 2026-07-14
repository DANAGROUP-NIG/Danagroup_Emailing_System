import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubsidiaryBranding1781600000000 implements MigrationInterface {
  name = "AddSubsidiaryBranding1781600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subsidiaries"
        ADD COLUMN IF NOT EXISTS "logo_url"    TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "favicon_url" TEXT DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subsidiaries"
        DROP COLUMN IF EXISTS "logo_url",
        DROP COLUMN IF EXISTS "favicon_url"
    `);
  }
}
