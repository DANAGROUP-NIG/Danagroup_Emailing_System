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
import { ChatMessage } from "./chat-message.entity";

@Index(["participantAId", "participantBId"], { unique: true })
@Entity("chat_conversations")
export class ChatConversation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  participantAId: string;

  @Column({ type: "uuid" })
  participantBId: string;

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
  @JoinColumn({ name: "participantAId" })
  participantA: User;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: "participantBId" })
  participantB: User;

  @OneToMany(() => ChatMessage, (message) => message.conversation)
  messages: ChatMessage[];
}
