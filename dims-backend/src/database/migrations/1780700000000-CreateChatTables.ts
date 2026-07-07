import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChatTables1780700000000 implements MigrationInterface {
  name = "CreateChatTables1780700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chat_conversations" (
        "id"              UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "participant_a_id"  UUID              NOT NULL,
        "participant_b_id"  UUID              NOT NULL,
        "last_message_id"   UUID,
        "last_message_at"   TIMESTAMPTZ,
        "created_at"       TIMESTAMPTZ       NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMPTZ       NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_conversations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_chat_conv_participants" UNIQUE ("participant_a_id", "participant_b_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id"               UUID        NOT NULL DEFAULT uuid_generate_v4(),
        "conversation_id"   UUID        NOT NULL,
        "sender_id"         UUID        NOT NULL,
        "body"             TEXT        NOT NULL,
        "is_read"           BOOLEAN     NOT NULL DEFAULT false,
        "read_at"           TIMESTAMPTZ,
        "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_messages" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_conversations"
        ADD CONSTRAINT "FK_chat_conv_participantA"
          FOREIGN KEY ("participant_a_id") REFERENCES "users"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_chat_conv_participantB"
          FOREIGN KEY ("participant_b_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_messages"
        ADD CONSTRAINT "FK_chat_msg_conversation"
          FOREIGN KEY ("conversation_id") REFERENCES "chat_conversations"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_chat_msg_sender"
          FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_chat_messages_conv_date"
        ON "chat_messages" ("conversation_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_chat_messages_sender"
        ON "chat_messages" ("sender_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_conversations"`);
  }
}
