import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Message } from "./message.entity";
import { User } from "@modules/users/entities/user.entity";

export type RecipientType = "to" | "cc" | "bcc";

@Entity("message_recipients")
export class MessageRecipient {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: ["to", "cc", "bcc"], default: "to" })
  type: RecipientType;

  @Column({ default: false })
  is_read: boolean;

  @Column({ default: false })
  is_starred: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ default: false })
  is_archived: boolean;

  @Column({ nullable: true, type: "timestamptz" })
  read_at: Date;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  // --- RELATIONSHIPS ---
  @ManyToOne(() => Message, (message) => message.recipients, { onDelete: "CASCADE"})
  @JoinColumn({ name: "message_id" })
  message: Message;
 
  @Column({ type: "uuid"})
  message_id: string;


  @ManyToOne(() => User)
  @JoinColumn({ name: "recipient_id" })
  recipient: User

  @Column()
  recipient_id: string;

}
