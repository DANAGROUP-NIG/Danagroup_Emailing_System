import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserSignature1780600000000 implements MigrationInterface {
  name = "AddUserSignature1780600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "signature" TEXT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "signature"
    `);
  }
}
