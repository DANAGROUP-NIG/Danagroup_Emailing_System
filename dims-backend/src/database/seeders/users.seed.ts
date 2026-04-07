import 'reflect-metadata';
import 'tsconfig-paths/register';
import { DeepPartial } from 'typeorm';
import { AppDataSource } from 'src/typeorm.config';
import { User } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Subsidiary } from '@modules/departments/entities/subsidiary.entity';
import { Department } from '@modules/departments/entities/department.entity';

async function seed() {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    const userRepo = AppDataSource.getRepository(User);
    const subRepo = AppDataSource.getRepository(Subsidiary);
    const deptRepo = AppDataSource.getRepository(Department);

    // Ensure there is a default subsidiary
    let hqSubsidiary = await subRepo.findOneBy({ domain: 'danagroup.com' });
    if (!hqSubsidiary) {
      hqSubsidiary = await subRepo.save(
        subRepo.create({
          name: 'Dana Group HQ',
          domain: 'danagroup.com',
          description: 'Default HQ subsidiary for local development',
        }),
      );
      console.log('Created subsidiary: Dana Group HQ');
    }

    // Ensure there is a default IT department
    let itDept = await deptRepo.findOneBy({
      name: 'IT',
      subsidiary_id: hqSubsidiary.id,
    });
    if (!itDept) {
      itDept = await deptRepo.save(
        deptRepo.create({
          name: 'IT',
          subsidiary_id: hqSubsidiary.id,
        }),
      );
      console.log('Created department: IT');
    }

    // User data
    const users: DeepPartial<User>[] = [
      {
        email: 'joseph@danagroup.com',
        firstName: 'Joseph',
        lastName: 'Okoro',
        role: 'group_admin',
        jobTitle: 'CTO',
        subsidiary_id: hqSubsidiary.id,
        department_id: itDept.id,
        isActive: true,
        avatarUrl: '[pravatar.cc](https://pravatar.cc/150?img=1)',
      },
      {
        email: 'emmanuel@danagroup.com',
        firstName: 'Emmanuel',
        lastName: 'Adewale',
        role: 'employee',
        jobTitle: 'Backend Engineer',
        subsidiary_id: hqSubsidiary.id,
        department_id: itDept.id,
        isActive: true,
        avatarUrl: '[pravatar.cc](https://pravatar.cc/150?img=2)',
      },
      {
        email: 'sunny@danagroup.com',
        firstName: 'Sunny',
        lastName: 'Ibrahim',
        role: 'employee',
        jobTitle: 'Frontend Engineer',
        subsidiary_id: hqSubsidiary.id,
        department_id: itDept.id,
        isActive: true,
        avatarUrl: '[pravatar.cc](https://pravatar.cc/150?img=3)',
      },
    ];

    for (const u of users) {
      const exists = await userRepo.findOneBy({ email: u.email });
      if (exists) {
        console.log(`User ${u.email} already exists, skipping...`);
        continue;
      }

      const hashedPassword = await bcrypt.hash('Password123', 12);
      const user = userRepo.create({
        ...u,
        passwordHash: hashedPassword,
      });

      await userRepo.save(user);
      console.log(`Created user: ${u.email}`);
    }

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
