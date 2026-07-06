import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExternalMailColumns1781000000000 implements MigrationInterface {
  name = "AddExternalMailColumns1781000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages"
        ADD COLUMN IF NOT EXISTS "isInbound"            BOOLEAN      NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "externalSenderEmail"  VARCHAR(320)
    `);

    await queryRunner.query(`
      ALTER TABLE "message_recipients"
        ADD COLUMN IF NOT EXISTS "externalEmail" VARCHAR(320)
    `);

    await queryRunner.query(`
      ALTER TABLE "message_recipients"
        ALTER COLUMN "recipientId" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages"
        DROP COLUMN IF EXISTS "isInbound",
        DROP COLUMN IF EXISTS "externalSenderEmail"
    `);
    await queryRunner.query(`
      ALTER TABLE "message_recipients"
        DROP COLUMN IF EXISTS "externalEmail"
    `);
  }
}
