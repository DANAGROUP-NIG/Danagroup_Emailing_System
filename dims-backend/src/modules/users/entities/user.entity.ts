import { Department } from "@modules/departments/entities/department.entity";
import { Subsidiary } from "@modules/departments/entities/subsidiary.entity";
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

  @Column({length: 100, unique: true})
  email: string;

  @Column({length: 255, select: false})
  passwordHash: string;

  @Column({length: 100})
  firstName: string;

  @Column({length: 100})
  lastName: string;

  @Column({
    type: "enum",
    enum: ["employee", "manager", "subsidiary_admin", "group_admin"],
    default: "employee",
  })
  role: UserRole;

  @Column({length: 150 })
  jobTitle: string;

  @Column({length:255})
  avatarUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, type: "timestamptz" })
  lastLoginAt: Date;

  @CreateDateColumn({ type: "timestamptz", default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  
  //Expose the ID directly as a string for easier filtering/saving
  @Column({ nullable: true })
  department_id: string;

  @Column({ nullable: true })
  subsidiary_id: string;

  // ---- RELATIONSHIPS ----
  @ManyToOne(() => Subsidiary, (subsidiary) => subsidiary.users)
  @JoinColumn({ name: "subsidiary_id" })
  subsidiary: Subsidiary

  @ManyToOne(() => Department, (department) => department.users)
  @JoinColumn({ name: "department_id" })
  department: Department
} 

