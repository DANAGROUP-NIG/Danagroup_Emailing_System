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
import { ChatConversation } from "./chat-conversation.entity";

@Index(["conversationId", "createdAt"])
@Index(["senderId"])
@Entity("chat_messages")
export class ChatMessage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  conversationId: string;

  @Column({ type: "uuid" })
  senderId: string;

  @Column({ type: "text" })
  body: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: "timestamptz", nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  // ---- RELATIONSHIPS ----
  @ManyToOne(() => ChatConversation, (conv) => conv.messages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "conversation_id" })
  conversation: ChatConversation;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: "sender_id" })
  sender: User;
}
