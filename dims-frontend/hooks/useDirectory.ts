'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api, mailApi } from '@/lib/api';
import type { User, Department, Subsidiary } from '@/types/user.types';

export interface DirectoryFilters {
  q?: string;
  subsidiaryId?: string;
  departmentId?: string;
  role?: string;
}

/**
 * Fetch paginated directory users with filtering
 */
export function useDirectoryUsers(filters: DirectoryFilters = {}, pageSize = 50) {
  return useInfiniteQuery({
    queryKey: ['directory', 'users', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams();
      params.append('limit', pageSize.toString());
      params.append('offset', (pageParam * pageSize).toString());
      if (filters.q) params.append('q', filters.q);
      if (filters.subsidiaryId) params.append('subsidiaryId', filters.subsidiaryId);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.role) params.append('role', filters.role);

      const res = await api.get(`/api/users?${params.toString()}`);
      return res.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.data?.length === pageSize ? allPages.length : undefined;
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
      const res = await api.get(`/api/users/${userId}`);
      return res.data as User;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Fetch all subsidiaries (cached)
 */
export function useSubsidiaries() {
  return useQuery({
    queryKey: ['subsidiaries'],
    queryFn: async () => {
      const res = await api.get('/api/departments/subsidiaries');
      return res.data as Subsidiary[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch departments, optionally filtered by subsidiary
 */
export function useDepartments(subsidiaryId?: string) {
  return useQuery({
    queryKey: ['departments', subsidiaryId],
    queryFn: async () => {
      const params = subsidiaryId ? `?subsidiaryId=${subsidiaryId}` : '';
      const res = await api.get(`/api/departments${params}`);
      return res.data as Department[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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
