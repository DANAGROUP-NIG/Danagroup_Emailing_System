import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1774884118357 implements MigrationInterface {
  name = "AutoMigration1774884118357";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT "UQ_departments_name_subsidiary"`,
    );
    await queryRunner.query(
      `ALTER TABLE "threads" ADD "last_activity_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e19b8c94e6afc03c66622dc7dc" ON "threads" ("last_activity_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "UQ_e947363ef8ab521cf9cc530cedc" UNIQUE ("name", "subsidiary_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT "UQ_e947363ef8ab521cf9cc530cedc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e19b8c94e6afc03c66622dc7dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "threads" DROP COLUMN "last_activity_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "UQ_departments_name_subsidiary" UNIQUE ("name", "subsidiary_id")`,
    );
  }
}
