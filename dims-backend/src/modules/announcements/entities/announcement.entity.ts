import { Department } from "@modules/departments/entities/department.entity";
import { Subsidiary } from "@modules/departments/entities/subsidiary.entity";
import { User } from "@modules/users/entities/user.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

export type AnnouncementTarget = "all" | "subsidiary" | "department";

@Entity("announcements")
export class Announcement {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: "text" })
  body: string;

  @Column({
    type: "enum",
    enum: ["all", "subsidiary", "department"],
    default: "all",
  })
  target: AnnouncementTarget;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ nullable: true, type: "timestamptz" })
  publishedAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  // ---- RELATIONSHIPS ----
  @ManyToOne(() => User, (user) => user.announcements)
  @JoinColumn({ name: "author_id" })
  author: User;

  @Column({ type: "uuid" })
  author_id: string;

  // 2. Optional Subsidiary Target
  @ManyToOne(() => Subsidiary)
  @JoinColumn({ name: "subsidiary_id" })
  subsidiary: Subsidiary;

  @Column({ type: "uuid", nullable: true })
  subsidiary_id: string;

  // 3. Optional Department Target
  @ManyToOne(() => Department)
  @JoinColumn({ name: "department_id" })
  department: Department;

  @Column({ type: "uuid", nullable: true })
  department_id: string;
}
