'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { departmentsApi } from '@/lib/api/departments';
import type { User, Department, Subsidiary } from '@/types/user.types';

export interface DirectoryFilters {
  q?: string | undefined;
  subsidiary?: string | undefined;
  department?: string | undefined;
  role?: string | undefined;
}

/**
 * Fetch paginated directory users with filtering
 */
export function useDirectoryUsers(filters: DirectoryFilters = {}, pageSize = 50) {
  return useInfiniteQuery({
    queryKey: ['directory', 'users', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await usersApi.list({
        search: filters.q,
        subsidiary: filters.subsidiary,
        department: filters.department,
        role: filters.role,
        limit: pageSize,
        page: (pageParam as number) + 1,
      });
      return res.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.pagination?.total ?? 0;
      const fetched = (allPages.length) * pageSize;
      return fetched < total ? allPages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single user by ID
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      const res = await usersApi.getById(userId);
      return res.data as User;
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch all subsidiaries (cached)
 */
export function useSubsidiaries() {
  return useQuery({
    queryKey: ['subsidiaries'],
    queryFn: async () => {
      const res = await departmentsApi.listSubsidiaries();
      return res.data as Subsidiary[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Fetch departments, optionally filtered by subsidiary
 */
export function useDepartments(subsidiaryId?: string) {
  return useQuery({
    queryKey: ['departments', subsidiaryId],
    queryFn: async () => {
      const res = await departmentsApi.list(subsidiaryId);
      return res.data as Department[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useDirectory() {
  return {
    useDirectoryUsers,
    useUser,
    useSubsidiaries,
    useDepartments,
  };
}
