import type { User, UserRole } from "@/types/user.types";

export const mockUser = (overrides?: Partial<User>): User => ({
  id: "user-1",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@dana.com",
  role: "employee" as UserRole,
  jobTitle: "Software Engineer",
  phone: "+234-123-4567",
  bio: "Experienced software engineer",
  departmentId: "dept-1",
  subsidiaryId: "sub-1",
  isActive: true,
  lastLoginAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockAdminUser = (overrides?: Partial<User>): User =>
  mockUser({
    id: "admin-1",
    firstName: "Admin",
    lastName: "User",
    email: "admin@dana.com",
    role: "group_admin" as UserRole,
    ...overrides,
  });

export const mockManagerUser = (overrides?: Partial<User>): User =>
  mockUser({
    id: "manager-1",
    firstName: "Manager",
    lastName: "User",
    email: "manager@dana.com",
    role: "manager" as UserRole,
    ...overrides,
  });

export const mockUsers: User[] = [
  mockUser(),
  mockAdminUser(),
  mockManagerUser(),
  mockUser({
    id: "user-2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@dana.com",
    role: "employee" as UserRole,
    jobTitle: "Product Manager",
  }),
  mockUser({
    id: "user-3",
    firstName: "Bob",
    lastName: "Johnson",
    email: "bob.johnson@dana.com",
    role: "subsidiary_admin" as UserRole,
    jobTitle: "Subsidiary Manager",
  }),
];
