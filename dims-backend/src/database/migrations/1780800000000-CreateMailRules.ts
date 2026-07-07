import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMailRules1780800000000 implements MigrationInterface {
  name = "CreateMailRules1780800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "mail_rules_action_enum" AS ENUM ('star', 'archive', 'trash', 'mark_read')
    `);

    await queryRunner.query(`
      CREATE TABLE "mail_rules" (
        "id"         UUID                       NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"     UUID                       NOT NULL,
        "name"       VARCHAR(200)               NOT NULL,
        "conditions" JSONB                      NOT NULL,
        "action"     "mail_rules_action_enum"   NOT NULL,
        "is_active"   BOOLEAN                    NOT NULL DEFAULT true,
        "created_at"  TIMESTAMPTZ                NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMPTZ                NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mail_rules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_mail_rules_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_mail_rules_user_active"
        ON "mail_rules" ("user_id", "is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "mail_rules"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "mail_rules_action_enum"`);
  }
}
