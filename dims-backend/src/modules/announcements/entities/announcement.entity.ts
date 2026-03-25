import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export type AnnouncementTarget = "all" | "subsidiary" | "department";

@Entity("announcements")
export class Announcement {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  authorId: string;

  @Column()
  title: string;

  @Column({ type: "text" })
  body: string;

  @Column({
    type: "enum",
    enum: ["all", "subsidiary", "department"],
    default: "all",
  })
  target: AnnouncementTarget;

  @Column({ nullable: true })
  subsidiaryId: string;

  @Column({ nullable: true })
  departmentId: string;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ nullable: true, type: "timestamptz" })
  publishedAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
