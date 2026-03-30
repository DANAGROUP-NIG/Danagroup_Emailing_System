// src/database/seeders/test-data.ts
import { AppDataSource } from "../../typeorm.config"; // Adjust path to your config
import { Subsidiary } from "../../modules/departments/entities/subsidiary.entity";
import { Department } from "../../modules/departments/entities/department.entity";

async function run() {
  try {
    // 1. Connect to the database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log("Database connected!");

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2. Insert Subsidiaries
      await queryRunner.query(`
        INSERT INTO "subsidiaries" (name, domain, created_at, updated_at)
        VALUES 
          ('Dana Group HQ', 'danagroup.com', now(), now()),
          ('Dana Pharma', 'danapharma.com', now(), now())
        ON CONFLICT (domain) DO NOTHING;
      `);

      // 3. Insert Departments
      await queryRunner.query(`
        INSERT INTO "departments" (name, subsidiary_id, created_at, updated_at)
        SELECT d.name, s.id, now(), now()
        FROM (
            VALUES ('IT', 'danagroup.com'), ('HR', 'danagroup.com')
        ) AS d(name, domain)
        JOIN subsidiaries s ON s.domain = d.domain
        ON CONFLICT DO NOTHING;
      `);

      await queryRunner.commitTransaction();
      console.log("Seeding completed successfully!");
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

run();
