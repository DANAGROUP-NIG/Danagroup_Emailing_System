import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, Index,
} from "typeorm";
import { User } from "@modules/users/entities/user.entity";

@Index(["ownerOrgId"])
@Entity("distribution_lists")
export class DistributionList {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ length: 320, unique: true })
  email: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ type: "uuid" })
  ownerId: string;

  @Column({ type: "uuid", nullable: true })
  ownerOrgId: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn()
  owner: User;

  @OneToMany(() => DistributionListMember, (m) => m.list, { cascade: true })
  members: DistributionListMember[];
}

@Entity("distribution_list_members")
export class DistributionListMember {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  listId: string;

  @Column({ type: "uuid" })
  userId: string;

  @CreateDateColumn({ type: "timestamptz" })
  joinedAt: Date;

  @ManyToOne(() => DistributionList, (l) => l.members, { onDelete: "CASCADE" })
  @JoinColumn()
  list: DistributionList;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;
}
