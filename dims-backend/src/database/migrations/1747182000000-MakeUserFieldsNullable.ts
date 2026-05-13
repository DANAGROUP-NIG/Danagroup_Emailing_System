import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeUserFieldsNullable1747182000000 implements MigrationInterface {
  name = "MakeUserFieldsNullable1747182000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "job_title" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "avatar_url" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users" SET "avatar_url" = '' WHERE "avatar_url" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "avatar_url" SET NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "job_title" = '' WHERE "job_title" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "job_title" SET NOT NULL`,
    );
  }
}
