import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSenderDeleteToMessages1774857600000 implements MigrationInterface {
  name = "AddSenderDeleteToMessages1774857600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" ADD COLUMN "sender_deleted_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" DROP COLUMN "sender_deleted_at"`,
    );
  }
}
