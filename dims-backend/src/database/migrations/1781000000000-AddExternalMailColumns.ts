import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExternalMailColumns1781000000000 implements MigrationInterface {
  name = "AddExternalMailColumns1781000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages"
        ADD COLUMN IF NOT EXISTS "is_inbound"            BOOLEAN      NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "external_sender_email"  VARCHAR(320)
    `);

    await queryRunner.query(`
      ALTER TABLE "message_recipients"
        ADD COLUMN IF NOT EXISTS "external_email" VARCHAR(320)
    `);

    await queryRunner.query(`
      ALTER TABLE "message_recipients"
        ALTER COLUMN "recipient_id" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages"
        DROP COLUMN IF EXISTS "is_inbound",
        DROP COLUMN IF EXISTS "external_sender_email"
    `);
    await queryRunner.query(`
      ALTER TABLE "message_recipients"
        DROP COLUMN IF EXISTS "external_email"
    `);
  }
}
