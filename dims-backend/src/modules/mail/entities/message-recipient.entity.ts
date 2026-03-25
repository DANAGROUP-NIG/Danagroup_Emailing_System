import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Message } from "./message.entity";

export type RecipientType = "to" | "cc" | "bcc";

@Entity("message_recipients")
export class MessageRecipient {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  messageId: string;

  @ManyToOne(() => Message)
  @JoinColumn({ name: "messageId" })
  message: Message;

  @Column()
  recipientId: string;

  @Column({ type: "enum", enum: ["to", "cc", "bcc"], default: "to" })
  type: RecipientType;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isStarred: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ nullable: true, type: "timestamptz" })
  readAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;
}
