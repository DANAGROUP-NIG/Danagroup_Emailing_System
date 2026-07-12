import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRawEmail1781500000000 implements MigrationInterface {
  name = "AddRawEmail1781500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "messages"
        ADD COLUMN IF NOT EXISTS "raw_email" TEXT
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_messages_imap_uid"
        ON "messages" ("sender_id", "sent_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_imap_uid"`);
    await queryRunner.query(`
      ALTER TABLE "messages" DROP COLUMN IF EXISTS "raw_email"
    `);
  }
}
