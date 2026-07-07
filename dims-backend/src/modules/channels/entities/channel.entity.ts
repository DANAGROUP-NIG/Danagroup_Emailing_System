import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "@modules/users/entities/user.entity";
import { ChannelMember } from "./channel-member.entity";
import { ChannelMessage } from "./channel-message.entity";

export type ChannelType = "public" | "private";

@Index(["type", "isArchived"])
@Entity("channels")
export class Channel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "enum", enum: ["public", "private"], default: "public" })
  type: ChannelType;

  @Column({ type: "uuid" })
  createdById: string;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ type: "uuid", nullable: true })
  lastMessageId: string | null;

  @Column({ type: "timestamptz", nullable: true })
  lastMessageAt: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  // ---- RELATIONSHIPS ----
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: "created_by_id" })
  createdBy: User;

  @OneToMany(() => ChannelMember, (m) => m.channel, { cascade: true })
  members: ChannelMember[];

  @OneToMany(() => ChannelMessage, (m) => m.channel)
  messages: ChannelMessage[];
}
