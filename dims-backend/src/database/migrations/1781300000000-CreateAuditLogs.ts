import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuditLogs1781300000000 implements MigrationInterface {
  name = "CreateAuditLogs1781300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
        "actor_id"     UUID,
        "actor_email"  VARCHAR(320),
        "action"      VARCHAR(80)  NOT NULL,
        "resource"    VARCHAR(80)  NOT NULL,
        "resource_id"  UUID,
        "meta"        JSONB,
        "ip_address"   VARCHAR(45),
        "user_agent"   VARCHAR(512),
        "status_code"  SMALLINT     NOT NULL DEFAULT 200,
        "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_actor"
          FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_actorId"   ON "audit_logs" ("actor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_action"    ON "audit_logs" ("action")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_resource"  ON "audit_logs" ("resource", "resource_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_createdAt" ON "audit_logs" ("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
