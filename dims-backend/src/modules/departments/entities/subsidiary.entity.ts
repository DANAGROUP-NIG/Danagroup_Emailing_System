import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from "typeorm";
import { Department } from "./department.entity";
import { User } from "@modules/users/entities/user.entity";

@Entity("subsidiaries")
export class Subsidiary {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({length: 50, unique: true })
  domain: string;

  @Column({ nullable: true, type: "text" })
  description: string;

  @CreateDateColumn({name: "created_at", type: "timestamptz", default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @UpdateDateColumn({name: "updated_at", type: "timestamptz", default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  // Relationships
  @OneToMany(() => Department, (department) => department.subsidiary)
  departments: Department[];

  @OneToMany(() => User, (user) => user.subsidiary)
  users: User[];
  
}
