import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

export type UserRole =
  | "employee"
  | "manager"
  | "subsidiary_admin"
  | "group_admin";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: "enum",
    enum: ["employee", "manager", "subsidiary_admin", "group_admin"],
    default: "employee",
  })
  role: UserRole;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  departmentId: string;

  @Column({ nullable: true })
  subsidiaryId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, type: "timestamptz" })
  lastLoginAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
