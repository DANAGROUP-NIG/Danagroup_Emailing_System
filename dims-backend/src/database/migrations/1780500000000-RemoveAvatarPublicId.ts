import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveAvatarPublicId1780500000000 implements MigrationInterface {
  name = "RemoveAvatarPublicId1780500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("users");
    if (table?.findColumnByName("avatar_public_id")) {
      await queryRunner.dropColumn("users", "avatar_public_id");
    }

    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "avatar_url" TYPE VARCHAR(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "avatar_url" TYPE VARCHAR(255)
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "avatar_public_id" VARCHAR
    `);
  }
}
