import { MigrationInterface, QueryRunner } from "typeorm";

export class PerformanceIndexes1780400000000 implements MigrationInterface {
  name = "PerformanceIndexes1780400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // users: fast lookup by email (login path)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email")`,
    );

    // users: filter by department / subsidiary in directory
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_department_id" ON "users" ("department_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_subsidiary_id" ON "users" ("subsidiary_id")`,
    );

    // users: active-only queries
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_is_active" ON "users" ("is_active")`,
    );

    // messages: sent-mailbox query (sender_id + draft flag)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messages_sender_id_is_draft" ON "messages" ("sender_id", "is_draft")`,
    );

    // messages: sender_deleted_at for trash queries
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_messages_sender_deleted_at" ON "messages" ("sender_deleted_at") WHERE sender_deleted_at IS NOT NULL`,
    );

    // message_recipients: composite for starred folder
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mr_recipient_is_deleted_is_starred" ON "message_recipients" ("recipient_id", "is_deleted", "is_starred")`,
    );

    // notifications: unread count query (most frequently called)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_user_id_is_read" ON "notifications" ("user_id", "is_read")`,
    );

    // notifications: listing by user ordered by date
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_notifications_user_id_created_at" ON "notifications" ("user_id", "created_at" DESC)`,
    );

    // announcements: sorted listing
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_announcements_is_pinned_published_at" ON "announcements" ("is_pinned" DESC, "published_at" DESC)`,
    );

    // user_thread_state: lookup by user for read-state aggregation
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_uts_user_id" ON "user_thread_state" ("user_id")`,
    );

    // threads: sort indexes for mailbox queries (last_message_at takes priority, falls back to last_activity_at)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_threads_last_message_at" ON "threads" ("last_message_at" DESC NULLS LAST)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_threads_last_activity_at" ON "threads" ("last_activity_at" DESC NULLS LAST)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_threads_last_message_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_threads_last_activity_at"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_uts_user_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_announcements_is_pinned_published_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notifications_user_id_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notifications_user_id_is_read"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_mr_recipient_is_deleted_is_starred"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_messages_sender_deleted_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_messages_sender_id_is_draft"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_subsidiary_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_department_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
  }
}
