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
        "created_by_id"   UUID                    NOT NULL,
        "is_archived"    BOOLEAN                 NOT NULL DEFAULT false,
        "last_message_id" UUID,
        "last_message_at" TIMESTAMPTZ,
        "created_at"     TIMESTAMPTZ             NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMPTZ             NOT NULL DEFAULT now(),
        CONSTRAINT "PK_channels" PRIMARY KEY ("id"),
        CONSTRAINT "FK_channels_creator"
          FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_channels_type_archived" ON "channels" ("type", "is_archived")
    `);

    await queryRunner.query(`
      CREATE TABLE "channel_members" (
        "id"          UUID                        NOT NULL DEFAULT uuid_generate_v4(),
        "channel_id"   UUID                        NOT NULL,
        "user_id"      UUID                        NOT NULL,
        "role"        "channel_members_role_enum" NOT NULL DEFAULT 'member',
        "last_read_at"  TIMESTAMPTZ,
        "joined_at"    TIMESTAMPTZ                 NOT NULL DEFAULT now(),
        CONSTRAINT "PK_channel_members"   PRIMARY KEY ("id"),
        CONSTRAINT "UQ_channel_member"    UNIQUE ("channel_id", "user_id"),
        CONSTRAINT "FK_channel_member_channel"
          FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_channel_member_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_channel_members_user" ON "channel_members" ("user_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "channel_messages" (
        "id"          UUID        NOT NULL DEFAULT uuid_generate_v4(),
        "channel_id"   UUID        NOT NULL,
        "sender_id"    UUID        NOT NULL,
        "body"        TEXT        NOT NULL,
        "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_channel_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_channel_msg_channel"
          FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_channel_msg_sender"
          FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_channel_messages_channel_date"
        ON "channel_messages" ("channel_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_channel_messages_sender"
        ON "channel_messages" ("sender_id")
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
