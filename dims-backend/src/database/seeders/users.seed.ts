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

    let hqSubsidiary = await subRepo.findOneBy({ name: "Dana Group HQ" });
    if (!hqSubsidiary) {
      hqSubsidiary = await subRepo.save(
        subRepo.create({ name: "Dana Group HQ", domain: "danagroup.com" }),
      );
    }

    let logisticsSubsidiary = await subRepo.findOneBy({
      name: "Dana Logistics",
    });
    if (!logisticsSubsidiary) {
      logisticsSubsidiary = await subRepo.save(
        subRepo.create({
          name: "Dana Logistics",
          domain: "logistics.danagroup.com",
        }),
      );
    }

    let manufacturingSubsidiary = await subRepo.findOneBy({
      name: "Dana Manufacturing",
    });
    if (!manufacturingSubsidiary) {
      manufacturingSubsidiary = await subRepo.save(
        subRepo.create({
          name: "Dana Manufacturing",
          domain: "factory.danagroup.com",
        }),
      );
    }

    // 2. Setup Departments (Check before creating)
    let itDept = await deptRepo.findOneBy({
      name: "IT",
      subsidiary_id: hqSubsidiary.id,
    });
    if (!itDept) {
      itDept = await deptRepo.save(
        deptRepo.create({ name: "IT", subsidiary_id: hqSubsidiary.id }),
      );
    }

    let hrDept = await deptRepo.findOneBy({
      name: "HR",
      subsidiary_id: hqSubsidiary.id,
    });
    if (!hrDept) {
      hrDept = await deptRepo.save(
        deptRepo.create({ name: "HR", subsidiary_id: hqSubsidiary.id }),
      );
    }

    let legalDept = await deptRepo.findOneBy({
      name: "Legal",
      subsidiary_id: hqSubsidiary.id,
    });
    if (!legalDept) {
      legalDept = await deptRepo.save(
        deptRepo.create({
          name: "Legal",
          subsidiary_id: hqSubsidiary.id,
        }),
      );
      console.log("Created department: Legal");
    }

    // 2. Setup Finance Department (Manufacturing)
    let financeDept = await deptRepo.findOneBy({
      name: "Finance",
      subsidiary_id: manufacturingSubsidiary.id,
    });
    if (!financeDept) {
      financeDept = await deptRepo.save(
        deptRepo.create({
          name: "Finance",
          subsidiary_id: manufacturingSubsidiary.id,
        }),
      );
      console.log("Created department: Finance");
    }

    // 3. Setup Operations Department (Logistics)
    let opsDept = await deptRepo.findOneBy({
      name: "Operations",
      subsidiary_id: logisticsSubsidiary.id,
    });
    if (!opsDept) {
      opsDept = await deptRepo.save(
        deptRepo.create({
          name: "Operations",
          subsidiary_id: logisticsSubsidiary.id,
        }),
      );
    }
    // 1. Setup Subsidiaries
    // const hqSubsidiary = await subRepo.save(subRepo.create({ name: 'Dana Group HQ', domain: 'danagroup.com' }));
    // const logisticsSubsidiary = await subRepo.save(subRepo.create({ name: 'Dana Logistics', domain: 'logistics.danagroup.com' }));
    // const manufacturingSubsidiary = await subRepo.save(subRepo.create({ name: 'Dana Manufacturing', domain: 'factory.danagroup.com' }));

    // 2. Setup Departments (Mapped to HQ)
    // const itDept = await deptRepo.save(deptRepo.create({ name: 'IT', subsidiary_id: hqSubsidiary.id }));
    // const hrDept = await deptRepo.save(deptRepo.create({ name: 'HR', subsidiary_id: hqSubsidiary.id }));
    // const legalDept = await deptRepo.save(deptRepo.create({ name: 'Legal', subsidiary_id: hqSubsidiary.id }));

    // 3. Setup Departments (Mapped to others)
    // const financeDept = await deptRepo.save(deptRepo.create({ name: 'Finance', subsidiary_id: manufacturingSubsidiary.id }));
    // const opsDept = await deptRepo.save(deptRepo.create({ name: 'Operations', subsidiary_id: logisticsSubsidiary.id }));

    // 4. User data using the created IDs
    const users: DeepPartial<User>[] = [
      {
        email: "joseph@danagroup.com",
        firstName: "Joseph",
        lastName: "Okoro",
        role: "group_admin",
        jobTitle: "CTO",
        subsidiary_id: hqSubsidiary.id,
        department_id: itDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
      {
        email: "marcus.chen@danagroup.com",
        firstName: "Marcus",
        lastName: "Chen",
        role: "employee",
        jobTitle: "Data Analyst",
        subsidiary_id: hqSubsidiary.id,
        department_id: itDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
      {
        email: "sarah.ade@danagroup.com",
        firstName: "Sarah",
        lastName: "Ade",
        role: "employee",
        jobTitle: "HR Specialist",
        subsidiary_id: hqSubsidiary.id,
        department_id: hrDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
      {
        email: "elena.rodriguez@danagroup.com",
        firstName: "Elena",
        lastName: "Rodriguez",
        role: "employee",
        jobTitle: "Accounting Manager",
        subsidiary_id: logisticsSubsidiary.id,
        department_id: financeDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
      {
        email: "james.wilson@danagroup.com",
        firstName: "James",
        lastName: "Wilson",
        role: "employee",
        jobTitle: "DevOps Engineer",
        subsidiary_id: hqSubsidiary.id,
        department_id: itDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
      {
        email: "amina.bello@danagroup.com",
        firstName: "Amina",
        lastName: "Bello",
        role: "employee",
        jobTitle: "Legal Counsel",
        subsidiary_id: hqSubsidiary.id,
        department_id: legalDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
      {
        email: "david.smith@danagroup.com",
        firstName: "David",
        lastName: "Smith",
        role: "employee",
        jobTitle: "Logistics Coordinator",
        subsidiary_id: logisticsSubsidiary.id,
        department_id: opsDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
      {
        email: "robert.taylor@danagroup.com",
        firstName: "Robert",
        lastName: "Taylor",
        role: "employee",
        jobTitle: "Procurement Lead",
        subsidiary_id: manufacturingSubsidiary.id,
        department_id: financeDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
    ];

    for (const u of users) {
      const exists = await userRepo.findOneBy({ email: u.email });
      if (exists) continue;

      const hashedPassword = await bcrypt.hash("Password123", 12);
      await userRepo.save(
        userRepo.create({
          ...u,
          passwordHash: hashedPassword,
        }),
      );
      console.log(`Created user: ${u.email}`);
    }

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding users:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
