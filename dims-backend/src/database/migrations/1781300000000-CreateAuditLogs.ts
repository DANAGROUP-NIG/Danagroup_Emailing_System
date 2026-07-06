import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuditLogs1781300000000 implements MigrationInterface {
  name = "CreateAuditLogs1781300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
        "actorId"     UUID,
        "actorEmail"  VARCHAR(320),
        "action"      VARCHAR(80)  NOT NULL,
        "resource"    VARCHAR(80)  NOT NULL,
        "resourceId"  UUID,
        "meta"        JSONB,
        "ipAddress"   VARCHAR(45),
        "userAgent"   VARCHAR(512),
        "statusCode"  SMALLINT     NOT NULL DEFAULT 200,
        "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_actor"
          FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_actorId"   ON "audit_logs" ("actorId")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_action"    ON "audit_logs" ("action")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_resource"  ON "audit_logs" ("resource", "resourceId")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_createdAt" ON "audit_logs" ("createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
