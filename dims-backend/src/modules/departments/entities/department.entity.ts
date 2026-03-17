import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Subsidiary } from "./subsidiary.entity";
import { User } from "@modules/users/entities/user.entity";


@Entity("departments")
export class Department {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({length: 100})
  name: string;

  @CreateDateColumn({name: "created_at", type: "timestamptz", default: () => 'CURRENT_TIMESTAMP'})
  createdAt: Date;

  @UpdateDateColumn({name: "updated_at", type: "timestamptz", default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relationships

  //Expose the ID directly as a string for easier filtering/saving
  @Column({type: "uuid"})
  subsidiary_id: string;

  @OneToMany(() => Subsidiary, (subsidiary) => subsidiary.departments, {
    nullable: false,
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "subsidiary_id" })
  subsidiary: Subsidiary;

  @OneToMany(() => User, (user) => user.department)
  users: User[];
}
