import { MigrationInterface, QueryRunner } from "typeorm";

export class FixDepartmentsUniqueConstraint1774442000000
  implements MigrationInterface
{
  name = "FixDepartmentsUniqueConstraint1774442000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "UQ_62c11dc60cf31d3f558fae5728d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "UQ_departments_name_subsidiary" UNIQUE ("name", "subsidiary_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "UQ_departments_name_subsidiary"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "UQ_62c11dc60cf31d3f558fae5728d" UNIQUE ("subsidiary_id")`,
    );
  }
}
