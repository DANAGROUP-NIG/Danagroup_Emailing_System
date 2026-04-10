import "reflect-metadata";
import "tsconfig-paths/register";
import { DeepPartial } from "typeorm";
import { AppDataSource } from "src/typeorm.config";
import { User } from "../../modules/users/entities/user.entity";
import * as bcrypt from "bcrypt";
import { Subsidiary } from "@modules/departments/entities/subsidiary.entity";
import { Department } from "@modules/departments/entities/department.entity";

async function seed() {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    const userRepo = AppDataSource.getRepository(User);
    const subRepo = AppDataSource.getRepository(Subsidiary);
    const deptRepo = AppDataSource.getRepository(Department);

    let hqSubsidiary = await subRepo.findOneBy({ domain: "danagroup.com" });
    if (!hqSubsidiary) {
      hqSubsidiary = await subRepo.save(
        subRepo.create({
          name: "Dana Group HQ",
          domain: "danagroup.com",
          description: "Default HQ subsidiary for local development",
        }),
      );
      console.log("Created subsidiary: Dana Group HQ");
    }

    let itDept = await deptRepo.findOneBy({
      name: "IT",
      subsidiary_id: hqSubsidiary.id,
    });

    if (!itDept) {
      itDept = await deptRepo.save(
        deptRepo.create({
          name: "IT",
          subsidiary_id: hqSubsidiary.id,
        }),
      );
      console.log("Created department: IT");
    }

    const users: DeepPartial<User>[] = [
      {
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        role: "group_admin",
        jobTitle: "CEO",
        subsidiary_id: hqSubsidiary.id, // Use the ID from the DB
        department_id: itDept.id, // Use the ID from the DB
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
      {
        email: "employee@example.com",
        firstName: "Employee",
        lastName: "User",
        role: "employee",
        jobTitle: "Developer",
        subsidiary_id: hqSubsidiary.id,
        department_id: itDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
    ];

    for (const u of users) {
      // Avoid duplicates
      const exists = await userRepo.findOneBy({ email: u.email });
      if (exists) {
        console.log(`User ${u.email} already exists, skipping...`);
        continue;
      }

      const hashedPassword = await bcrypt.hash("Password123", 12);
      const user = userRepo.create({
        ...u,
        passwordHash: hashedPassword,
      });

      await userRepo.save(user);
      console.log(`Created user: ${u.email}`);
    }

    console.log("Seeding successful!");
  } catch (error) {
    console.error("Error seeding users:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
