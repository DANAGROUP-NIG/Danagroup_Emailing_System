import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPermanentDeleteColumn1774972721014 implements MigrationInterface {
    name = 'AddPermanentDeleteColumn1774972721014'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_recipients" ADD "is_permanently_deleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "message_recipients" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`UPDATE "threads" SET "last_activity_at" = NOW() WHERE "last_activity_at" IS NULL`);
        await queryRunner.query(`ALTER TABLE "threads" ALTER COLUMN "last_activity_at" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "threads" ALTER COLUMN "last_activity_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "threads" ALTER COLUMN "last_activity_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "message_recipients" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "message_recipients" DROP COLUMN "is_permanently_deleted"`);
    }

}
