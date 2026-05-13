import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeAttachmentMessageOptional1777293000000 implements MigrationInterface {
  name = "MakeAttachmentMessageOptional1777293000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "attachments" ALTER COLUMN "message_id" DROP NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DELETE FROM "attachments" WHERE "message_id" IS NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "attachments" ALTER COLUMN "message_id" SET NOT NULL',
    );
  }
}
