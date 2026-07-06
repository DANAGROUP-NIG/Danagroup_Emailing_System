import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { User } from "@modules/users/entities/user.entity";
import { Channel } from "./channel.entity";

export type ChannelRole = "owner" | "admin" | "member";

@Unique(["channelId", "userId"])
@Index(["userId"])
@Entity("channel_members")
export class ChannelMember {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  channelId: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({
    type: "enum",
    enum: ["owner", "admin", "member"],
    default: "member",
  })
  role: ChannelRole;

  @Column({ type: "timestamptz", nullable: true })
  lastReadAt: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  joinedAt: Date;

  // ---- RELATIONSHIPS ----
  @ManyToOne(() => Channel, (c) => c.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "channelId" })
  channel: Channel;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: "userId" })
  user: User;
}
