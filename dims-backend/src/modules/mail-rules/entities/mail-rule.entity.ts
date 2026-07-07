import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "@modules/users/entities/user.entity";

export type RuleConditionField = "from" | "subject" | "body";
export type RuleConditionOperator =
  | "contains"
  | "equals"
  | "starts_with"
  | "ends_with";
export type RuleAction = "star" | "archive" | "trash" | "mark_read";

export interface RuleCondition {
  field: RuleConditionField;
  operator: RuleConditionOperator;
  value: string;
}

@Index(["userId", "isActive"])
@Entity("mail_rules")
export class MailRule {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: "jsonb" })
  conditions: RuleCondition[];

  @Column({
    type: "enum",
    enum: ["star", "archive", "trash", "mark_read"],
  })
  action: RuleAction;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  // ---- RELATIONSHIPS ----
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}
