import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMessageRecipientIndexes1747182060000 implements MigrationInterface {
  name = "AddMessageRecipientIndexes1747182060000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_mr_recipient_id_is_deleted" ON "message_recipients" ("recipient_id", "is_deleted")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mr_recipient_id_is_read" ON "message_recipients" ("recipient_id", "is_read")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_mr_message_id" ON "message_recipients" ("message_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_mr_message_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_mr_recipient_id_is_read"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_mr_recipient_id_is_deleted"`,
    );
  }
}
