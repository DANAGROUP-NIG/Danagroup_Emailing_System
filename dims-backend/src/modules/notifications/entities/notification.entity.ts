import { User } from "@modules/users/entities/user.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

export type NotificationType = "new_mail" | "announcement" | "system";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    length: 50,
    type: "enum",
    enum: ["new_mail", "announcement", "system"],
    default: "system",
  })
  type: NotificationType;

  @Column({ length: 255 })
  title: string;

  @Column({ nullable: true, type: "text" })
  body: string;

  @Column({ default: false })
  is_read: boolean;

  @Column({ nullable: true, type: "uuid" })
  reference_id: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  // ---- RELATIONSHIPS ----
  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "uuid" })
  user_id: string;

}
