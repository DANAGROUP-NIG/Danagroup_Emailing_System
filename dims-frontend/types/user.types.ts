export type UserRole = "employee" | "manager" | "subsidiary_admin" | "group_admin";

export interface Subsidiary {
  id: string;
  name: string;
  domain: string;
  description?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  subsidiaryId: string;
  subsidiary?: Subsidiary;
  createdAt: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  jobTitle?: string;
  avatarUrl?: string;
  departmentId?: string;
  department?: Department;
  subsidiaryId?: string;
  subsidiary?: Subsidiary;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}


export type LoginProps = {
    email: string;
    password: string;
};
