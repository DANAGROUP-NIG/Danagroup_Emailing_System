import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "@modules/users/entities/user.entity";
import { Channel } from "./channel.entity";

@Index(["channelId", "createdAt"])
@Index(["senderId"])
@Entity("channel_messages")
export class ChannelMessage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  channelId: string;

  @Column({ type: "uuid" })
  senderId: string;

  @Column({ type: "text" })
  body: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  // ---- RELATIONSHIPS ----
  @ManyToOne(() => Channel, (c) => c.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "channelId" })
  channel: Channel;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: "senderId" })
  sender: User;
}
