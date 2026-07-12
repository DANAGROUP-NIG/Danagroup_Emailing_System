import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExternalSenderName1781400000000 implements MigrationInterface {
  name = "AddExternalSenderName1781400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages"
        ADD COLUMN IF NOT EXISTS "external_sender_name" VARCHAR(320)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages"
        DROP COLUMN IF EXISTS "external_sender_name"
    `);
  }
}
