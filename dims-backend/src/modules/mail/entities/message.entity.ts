import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Thread } from "./thread.entity";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  threadId: string;

  @Column()
  senderId: string;

  @Column()
  subject: string;

  @Column({ type: "text"  })
  body: string;

  @Column({ type: "text", nullable: true })
  bodyHtml: string;

  @Column({ default: false })
  isDraft: boolean;

  @Column({ nullable: true, type: "timestamptz" })
  sentAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @ManyToOne(() => Thread)
  @JoinColumn({ name: "threadId" })
  thread: Thread;

}
