import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Message } from "../../mail/entities/message.entity";

@Entity("attachments")
export class Attachment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  messageId: string;

  @ManyToOne(() => Message)
  @JoinColumn({ name: "messageId" })
  message: Message;

  @Column()
  uploaderId: string;

  @Column()
  filename: string;

  @Column()
  mimeType: string;

  @Column({ type: "bigint" })
  sizeBytes: number;

  @Column()
  storageKey: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;
}
