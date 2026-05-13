import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Message } from "./message.entity";
import { User } from "@modules/users/entities/user.entity";

export type RecipientType = "to" | "cc" | "bcc";

@Index(["recipientId", "isDeleted"])
@Index(["recipientId", "isRead"])
@Index(["messageId"])
@Entity("message_recipients")
export class MessageRecipient {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: ["to", "cc", "bcc"], default: "to" })
  type: RecipientType;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isStarred: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: false })
  isPermanentlyDeleted: boolean;

  @Column({ nullable: true, type: "timestamptz" })
  deletedAt: Date;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ nullable: true, type: "timestamptz" })
  readAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  // --- RELATIONSHIPS ---
  @ManyToOne(() => Message, (message) => message.recipients, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  message: Message;

  @Column({ type: "uuid" })
  messageId: string;

  @ManyToOne(() => User)
  @JoinColumn()
  recipient: User;

  @Column({ type: "uuid" })
  recipientId: string;
}
