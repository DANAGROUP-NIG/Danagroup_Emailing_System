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
import { UserThreadState } from "./UserThreadState.entity";

@Index(["lastMessageAt"])
@Entity("threads")
export class Thread {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 500 })
  subject: string;

  @Column({ type: "text", nullable: true })
  snippet: string;

  @Index() // important for inbox sorting
  @Column({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  lastActivityAt: Date;

  @CreateDateColumn({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @Column({ name: "last_message_at", type: "timestamp", nullable: true })
  lastMessageAt: Date;

  @OneToMany(() => Message, (message) => message.thread)
  messages: Message[];

  @OneToMany(() => UserThreadState, (uts) => uts.thread)
  userStates: UserThreadState[];
}
