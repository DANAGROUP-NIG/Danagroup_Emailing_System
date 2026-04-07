import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Thread } from "./thread.entity";
import { User } from "@modules/users/entities/user.entity";
import { MessageRecipient } from "./message-recipient.entity";
import { Attachment } from "@modules/files/entities/attachment.entity";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  threadId: string;

  @Column()
  senderId: string;

  @Column({length: 500})
  subject: string;

  @Column({ type: "text"  })
  body: string;

  @Column({ type: "text", nullable: true })
  bodyHtml: string;

  @Column({ default: false })
  is_draft: boolean;

  @Column({ nullable: true, type: "timestamptz" })
  sentAt: Date;

  @Column({ nullable: true, type: "timestamptz" })
  sender_deleted_at: Date;

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @ManyToOne(() => Thread, (thread) => thread.messages)
  @JoinColumn({ name: "thread_id" })
  thread: Thread;

  @ManyToOne(() => User)
  @JoinColumn({ name: "sender_id" })
  sender: User;

  @OneToMany(() => MessageRecipient, (recipient) => recipient.message)
  recipients: MessageRecipient[];

  @OneToMany(() => Attachment, (attachment) => attachment.message )
  attachments: Attachment[];

}
