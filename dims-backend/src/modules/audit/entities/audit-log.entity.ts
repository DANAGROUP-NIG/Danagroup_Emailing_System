import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "@modules/users/entities/user.entity";

@Index(["actorId"])
@Index(["resource", "resourceId"])
@Index(["action"])
@Index(["createdAt"])
@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: true })
  actorId: string | null;

  @Column({ length: 320, nullable: true })
  actorEmail: string | null;

  @Column({ length: 80 })
  action: string;

  @Column({ length: 80 })
  resource: string;

  @Column({ type: "uuid", nullable: true })
  resourceId: string | null;

  @Column({ type: "jsonb", nullable: true })
  meta: Record<string, unknown> | null;

  @Column({ type: "varchar", length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: "varchar", length: 512, nullable: true })
  userAgent: string | null;

  @Column({ type: "smallint", default: 200 })
  statusCode: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn()
  actor: User;
}
