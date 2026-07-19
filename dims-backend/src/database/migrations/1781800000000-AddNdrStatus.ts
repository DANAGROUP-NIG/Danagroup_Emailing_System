import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNdrStatus1781800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the enum type first
    await queryRunner.query(
      `CREATE TYPE "message_recipients_ndr_status_enum" AS ENUM('delivered', 'bounced')`,
    );

    // Add the nullable column with no default — existing rows remain NULL
    await queryRunner.query(
      `ALTER TABLE "message_recipients"
       ADD COLUMN IF NOT EXISTS "ndr_status" "message_recipients_ndr_status_enum" DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message_recipients" DROP COLUMN IF EXISTS "ndr_status"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "message_recipients_ndr_status_enum"`,
    );
  }
}
