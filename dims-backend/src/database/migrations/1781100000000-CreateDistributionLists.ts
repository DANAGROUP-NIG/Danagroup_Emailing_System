import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDistributionLists1781100000000 implements MigrationInterface {
  name = "CreateDistributionLists1781100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "distribution_lists" (
        "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
        "name"        VARCHAR(120) NOT NULL,
        "description" TEXT,
        "email"       VARCHAR(320) NOT NULL,
        "is_public"    BOOLEAN      NOT NULL DEFAULT false,
        "owner_id"     UUID         NOT NULL,
        "owner_org_id"  UUID,
        "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_distribution_lists" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_distribution_lists_email" UNIQUE ("email"),
        CONSTRAINT "FK_distribution_lists_owner"
          FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_distribution_lists_ownerOrgId"
        ON "distribution_lists" ("owner_org_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "distribution_list_members" (
        "id"       UUID        NOT NULL DEFAULT gen_random_uuid(),
        "list_id"   UUID        NOT NULL,
        "user_id"   UUID        NOT NULL,
        "joined_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_distribution_list_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_dl_member_list_user" UNIQUE ("list_id", "user_id"),
        CONSTRAINT "FK_dl_member_list"
          FOREIGN KEY ("list_id") REFERENCES "distribution_lists"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_dl_member_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "distribution_list_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "distribution_lists"`);
  }
}
