import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChatTables1780700000000 implements MigrationInterface {
  name = "CreateChatTables1780700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chat_conversations" (
        "id"              UUID              NOT NULL DEFAULT uuid_generate_v4(),
        "participantAId"  UUID              NOT NULL,
        "participantBId"  UUID              NOT NULL,
        "lastMessageId"   UUID,
        "lastMessageAt"   TIMESTAMPTZ,
        "createdAt"       TIMESTAMPTZ       NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMPTZ       NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_conversations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_chat_conv_participants" UNIQUE ("participantAId", "participantBId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id"               UUID        NOT NULL DEFAULT uuid_generate_v4(),
        "conversationId"   UUID        NOT NULL,
        "senderId"         UUID        NOT NULL,
        "body"             TEXT        NOT NULL,
        "isRead"           BOOLEAN     NOT NULL DEFAULT false,
        "readAt"           TIMESTAMPTZ,
        "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_messages" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_conversations"
        ADD CONSTRAINT "FK_chat_conv_participantA"
          FOREIGN KEY ("participantAId") REFERENCES "users"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_chat_conv_participantB"
          FOREIGN KEY ("participantBId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_messages"
        ADD CONSTRAINT "FK_chat_msg_conversation"
          FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE,
        ADD CONSTRAINT "FK_chat_msg_sender"
          FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_chat_messages_conv_date"
        ON "chat_messages" ("conversationId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_chat_messages_sender"
        ON "chat_messages" ("senderId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_conversations"`);
  }
}
