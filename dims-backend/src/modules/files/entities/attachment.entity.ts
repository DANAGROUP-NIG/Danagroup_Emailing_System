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
  uploader_id: string;

  @Column({ length: 255 })
  filename: string;

  @Column({ length: 100 })
  mime_type: string;

  @Column({ type: "bigint" })
  size_bytes: number;

  @Column({ length: 500 })
  storage_key: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  //---- RELATIONSHIPS ----
  @ManyToOne(() => Message, (msg) => msg.attachments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "message_id" })
  message: Message;

  @Column({ type: "uuid" })
  message_id: string;
}
