import { Announcement } from "@modules/announcements/entities/announcement.entity";
import { Department } from "@modules/departments/entities/department.entity";
import { Subsidiary } from "@modules/departments/entities/subsidiary.entity";
import { MessageRecipient } from "@modules/mail/entities/message-recipient.entity";
import { Message } from "@modules/mail/entities/message.entity";
import { Notification } from "@modules/notifications/entities/notification.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from "typeorm";

export type UserRole =
  | "employee"
  | "manager"
  | "subsidiary_admin"
  | "group_admin";

@Index(["departmentId", "isActive"])
@Index(["subsidiaryId", "isActive"])
@Index(["isActive"])
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 255, select: false })
  passwordHash: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({
    type: "enum",
    enum: ["employee", "manager", "subsidiary_admin", "group_admin"],
    default: "employee",
  })
  role: UserRole;

  @Column({ length: 150, nullable: true })
  jobTitle?: string;

  @Column({ length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, type: "timestamptz" })
  lastLoginAt: Date;

  @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;

  //Expose the ID directly as a string for easier filtering/saving
  @Column()
  departmentId: string;

  @Column()
  subsidiaryId: string;

  @Column("json", { nullable: true })
  sessions?: {
    refreshToken: string;
    userAgent: string;
    ip: string;
  }[];

  // ---- RELATIONSHIPS ----
  @ManyToOne(() => Subsidiary, (subsidiary) => subsidiary.users)
  @JoinColumn()
  subsidiary: Subsidiary;

  @ManyToOne(() => Department, (department) => department.users)
  @JoinColumn()
  department: Department;

  // 1. Messages this user SENT
  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  // 2. Messages this user RECEIVED (via the recipient table)
  @OneToMany(
    () => MessageRecipient,
    (messageRecipient) => messageRecipient.recipient,
  )
  receivedMessages: MessageRecipient[];

  // 3. Announcements this user AUTHORED
  @OneToMany(() => Announcement, (announcement) => announcement.author)
  announcements: Announcement[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
