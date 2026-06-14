import type { User, Subsidiary, Department } from './user.types';

export type AnnouncementTarget = 'all' | 'subsidiary' | 'department';

export interface Announcement {
  id: string;
  title: string;
  body: string; // HTML content
  author: User;
  target: AnnouncementTarget;
  subsidiary?: Subsidiary;
  department?: Department;
  isPinned: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  target: AnnouncementTarget;
  subsidiaryId?: string;
  departmentId?: string;
  isPinned?: boolean;
}

export interface UpdateAnnouncementInput {
  title?: string;
  body?: string;
  target?: AnnouncementTarget;
  subsidiaryId?: string;
  departmentId?: string;
  isPinned?: boolean;
}

export interface AnnouncementResponse {
  data: Announcement[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}
