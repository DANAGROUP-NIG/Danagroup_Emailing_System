import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

export type NotificationType = "new_mail" | "announcement" | "system";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @Column({
    type: "enum",
    enum: ["new_mail", "announcement", "system"],
    default: "system",
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ nullable: true, type: "text" })
  body: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  referenceId: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;
}
