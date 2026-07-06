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
        "isPublic"    BOOLEAN      NOT NULL DEFAULT false,
        "ownerId"     UUID         NOT NULL,
        "ownerOrgId"  UUID,
        "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_distribution_lists" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_distribution_lists_email" UNIQUE ("email"),
        CONSTRAINT "FK_distribution_lists_owner"
          FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_distribution_lists_ownerOrgId"
        ON "distribution_lists" ("ownerOrgId")
    `);

    await queryRunner.query(`
      CREATE TABLE "distribution_list_members" (
        "id"       UUID        NOT NULL DEFAULT gen_random_uuid(),
        "listId"   UUID        NOT NULL,
        "userId"   UUID        NOT NULL,
        "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_distribution_list_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_dl_member_list_user" UNIQUE ("listId", "userId"),
        CONSTRAINT "FK_dl_member_list"
          FOREIGN KEY ("listId") REFERENCES "distribution_lists"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_dl_member_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "distribution_list_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "distribution_lists"`);
  }
}
