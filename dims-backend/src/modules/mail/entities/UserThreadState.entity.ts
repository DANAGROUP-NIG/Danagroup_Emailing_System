import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  Index,
} from "typeorm";
import { Thread } from "./thread.entity";

@Index(["userId", "threadId"], { unique: true })
@Entity("user_thread_state")
export class UserThreadState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "uuid" })
  threadId: string;

  @Column({ default: 0 })
  unreadCount: number;

  @Column({ default: false })
  isStarred: boolean;

  @Column({ default: false })
  isRead: boolean;

  @ManyToOne(() => Thread, (thread) => thread.userStates)
  @JoinColumn({ name: "thread_id" })
  thread: Thread;
}
