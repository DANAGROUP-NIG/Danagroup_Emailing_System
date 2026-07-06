import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChannelTables1780900000000 implements MigrationInterface {
  name = "CreateChannelTables1780900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "channels_type_enum" AS ENUM ('public', 'private')
    `);

    await queryRunner.query(`
      CREATE TYPE "channel_members_role_enum" AS ENUM ('owner', 'admin', 'member')
    `);

    await queryRunner.query(`
      CREATE TABLE "channels" (
        "id"            UUID                    NOT NULL DEFAULT uuid_generate_v4(),
        "name"          VARCHAR(100)            NOT NULL,
        "description"   TEXT,
        "type"          "channels_type_enum"    NOT NULL DEFAULT 'public',
        "createdById"   UUID                    NOT NULL,
        "isArchived"    BOOLEAN                 NOT NULL DEFAULT false,
        "lastMessageId" UUID,
        "lastMessageAt" TIMESTAMPTZ,
        "createdAt"     TIMESTAMPTZ             NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMPTZ             NOT NULL DEFAULT now(),
        CONSTRAINT "PK_channels" PRIMARY KEY ("id"),
        CONSTRAINT "FK_channels_creator"
          FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_channels_type_archived" ON "channels" ("type", "isArchived")
    `);

    await queryRunner.query(`
      CREATE TABLE "channel_members" (
        "id"          UUID                        NOT NULL DEFAULT uuid_generate_v4(),
        "channelId"   UUID                        NOT NULL,
        "userId"      UUID                        NOT NULL,
        "role"        "channel_members_role_enum" NOT NULL DEFAULT 'member',
        "lastReadAt"  TIMESTAMPTZ,
        "joinedAt"    TIMESTAMPTZ                 NOT NULL DEFAULT now(),
        CONSTRAINT "PK_channel_members"   PRIMARY KEY ("id"),
        CONSTRAINT "UQ_channel_member"    UNIQUE ("channelId", "userId"),
        CONSTRAINT "FK_channel_member_channel"
          FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_channel_member_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_channel_members_user" ON "channel_members" ("userId")
    `);

    await queryRunner.query(`
      CREATE TABLE "channel_messages" (
        "id"          UUID        NOT NULL DEFAULT uuid_generate_v4(),
        "channelId"   UUID        NOT NULL,
        "senderId"    UUID        NOT NULL,
        "body"        TEXT        NOT NULL,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_channel_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_channel_msg_channel"
          FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_channel_msg_sender"
          FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_channel_messages_channel_date"
        ON "channel_messages" ("channelId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_channel_messages_sender"
        ON "channel_messages" ("senderId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "channel_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "channel_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "channels"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "channel_members_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "channels_type_enum"`);
  }
}
