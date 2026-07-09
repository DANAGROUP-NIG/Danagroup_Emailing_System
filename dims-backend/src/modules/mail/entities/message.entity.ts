import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Thread } from "./thread.entity";
import { User } from "@modules/users/entities/user.entity";
import { MessageRecipient } from "./message-recipient.entity";
import { Attachment } from "@modules/files/entities/attachment.entity";

@Index(["threadId", "sentAt"])
@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  threadId: string;

  @Column()
  senderId: string;

  @Column({ length: 500 })
  subject: string;

  @Column({ type: "text" })
  body: string;

  @Column({ type: "text", nullable: true })
  bodyHtml: string;

  @Column({ default: false })
  isDraft: boolean;

  @Column({ nullable: true, type: "timestamptz" })
  sentAt: Date;

  @Column({ nullable: true, type: "timestamptz" })
  senderDeletedAt: Date;

  @Column({ default: false })
  isInbound: boolean;

  @Column({ type: "varchar", length: 320, nullable: true })
  externalSenderEmail: string | null;

  @Column({ type: "varchar", length: 320, nullable: true })
  externalSenderName: string | null;

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @ManyToOne(() => Thread, (thread) => thread.messages)
  @JoinColumn()
  thread: Thread;

  @ManyToOne(() => User)
  @JoinColumn()
  sender: User;

  @OneToMany(() => MessageRecipient, (recipient) => recipient.message)
  recipients: MessageRecipient[];

  @OneToMany(() => Attachment, (attachment) => attachment.message)
  attachments: Attachment[];
}
