import "reflect-metadata";

if (process.env.NODE_ENV !== "production") {
  require("tsconfig-paths/register");
}
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
        subRepo.create({ name: "Dana Group HQ", domain: "danagroup.net" }),
      );
    }

    let logisticsSubsidiary = await subRepo.findOneBy({
      name: "Dana Logistics",
    });
    if (!logisticsSubsidiary) {
      logisticsSubsidiary = await subRepo.save(
        subRepo.create({
          name: "Dana Logistics",
          domain: "logistics.danagroup.net",
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
          domain: "factory.danagroup.net",
        }),
      );
    }

    // 2. Setup Departments (Check before creating)
    let itDept = await deptRepo.findOneBy({
      name: "IT",
      subsidiaryId: hqSubsidiary.id,
    });
    if (!itDept) {
      itDept = await deptRepo.save(
        deptRepo.create({ name: "IT", subsidiaryId: hqSubsidiary.id }),
      );
    }

    let hrDept = await deptRepo.findOneBy({
      name: "HR",
      subsidiaryId: hqSubsidiary.id,
    });
    if (!hrDept) {
      hrDept = await deptRepo.save(
        deptRepo.create({ name: "HR", subsidiaryId: hqSubsidiary.id }),
      );
    }

    let legalDept = await deptRepo.findOneBy({
      name: "Legal",
      subsidiaryId: hqSubsidiary.id,
    });
    if (!legalDept) {
      legalDept = await deptRepo.save(
        deptRepo.create({
          name: "Legal",
          subsidiaryId: hqSubsidiary.id,
        }),
      );
      console.log("Created department: Legal");
    }

    // 2. Setup Finance Department (Manufacturing)
    let financeDept = await deptRepo.findOneBy({
      name: "Finance",
      subsidiaryId: manufacturingSubsidiary.id,
    });
    if (!financeDept) {
      financeDept = await deptRepo.save(
        deptRepo.create({
          name: "Finance",
          subsidiaryId: manufacturingSubsidiary.id,
        }),
      );
      console.log("Created department: Finance");
    }

    // 3. Setup Operations Department (Logistics)
    let opsDept = await deptRepo.findOneBy({
      name: "Operations",
      subsidiaryId: logisticsSubsidiary.id,
    });
    if (!opsDept) {
      opsDept = await deptRepo.save(
        deptRepo.create({
          name: "Operations",
          subsidiaryId: logisticsSubsidiary.id,
        }),
      );
    }
    // 1. Setup Subsidiaries
    // const hqSubsidiary = await subRepo.save(subRepo.create({ name: 'Dana Group HQ', domain: 'danagroup.net' }));
    // const logisticsSubsidiary = await subRepo.save(subRepo.create({ name: 'Dana Logistics', domain: 'logistics.danagroup.net' }));
    // const manufacturingSubsidiary = await subRepo.save(subRepo.create({ name: 'Dana Manufacturing', domain: 'factory.danagroup.net' }));

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
        email: "joseph@danagroup.net",
        firstName: "Joseph",
        lastName: "Okoro",
        role: "group_admin",
        jobTitle: "CTO",
        subsidiaryId: hqSubsidiary.id,
        departmentId: itDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
      {
        email: "marcus.chen@danagroup.net",
        firstName: "Marcus",
        lastName: "Chen",
        role: "employee",
        jobTitle: "Data Analyst",
        subsidiaryId: hqSubsidiary.id,
        departmentId: itDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
      {
        email: "sarah.ade@danagroup.net",
        firstName: "Sarah",
        lastName: "Ade",
        role: "employee",
        jobTitle: "HR Specialist",
        subsidiaryId: hqSubsidiary.id,
        departmentId: hrDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
      {
        email: "elena.rodriguez@danagroup.net",
        firstName: "Elena",
        lastName: "Rodriguez",
        role: "employee",
        jobTitle: "Accounting Manager",
        subsidiaryId: logisticsSubsidiary.id,
        departmentId: financeDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
      {
        email: "james.wilson@danagroup.net",
        firstName: "James",
        lastName: "Wilson",
        role: "employee",
        jobTitle: "DevOps Engineer",
        subsidiaryId: hqSubsidiary.id,
        departmentId: itDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
      {
        email: "amina.bello@danagroup.net",
        firstName: "Amina",
        lastName: "Bello",
        role: "employee",
        jobTitle: "Legal Counsel",
        subsidiaryId: hqSubsidiary.id,
        departmentId: legalDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
      {
        email: "david.smith@danagroup.net",
        firstName: "David",
        lastName: "Smith",
        role: "employee",
        jobTitle: "Logistics Coordinator",
        subsidiaryId: logisticsSubsidiary.id,
        departmentId: opsDept.id,
        isActive: true,
        avatarUrl: "https://pravatar.cc",
      },
      {
        email: "robert.taylor@danagroup.net",
        firstName: "Robert",
        lastName: "Taylor",
        role: "employee",
        jobTitle: "Procurement Lead",
        subsidiaryId: manufacturingSubsidiary.id,
        departmentId: financeDept.id,
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

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding users:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
