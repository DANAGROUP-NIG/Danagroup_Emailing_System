import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailIndexes1824972720012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX idx_messages_thread_id ON public.messages(thread_id);
      CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
      CREATE INDEX idx_messages_sent_at ON public.messages(sent_at);

      CREATE INDEX idx_recipient_user ON public.message_recipients(recipient_id);
      CREATE INDEX idx_recipient_read ON public.message_recipients(is_read);

      CREATE INDEX idx_threads_last_activity ON public.threads(last_activity_at);

    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX idx_message_thread_id;
      DROP INDEX idx_message_sender_id;
      DROP INDEX idx_message_sent_at;

      DROP INDEX idx_recipient_user;
      DROP INDEX idx_recipient_read;

      DROP INDEX idx_thread_last_activity;
    `);
  }
}
