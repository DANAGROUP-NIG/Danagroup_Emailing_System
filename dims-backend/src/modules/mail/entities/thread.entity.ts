import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Message } from "./message.entity";

@Entity("threads")
export class Thread {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 500 })
  subject: string;

  @Index() // important for inbox sorting
  @Column({
    name: "last_activity_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  lastActivityAt: Date;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @OneToMany(() => Message, (message) => message.thread)
  messages: Message[];
}
