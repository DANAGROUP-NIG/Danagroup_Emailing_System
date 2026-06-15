'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Announcement, AnnouncementResponse, CreateAnnouncementInput, UpdateAnnouncementInput, AnnouncementTarget } from '@/types/announcement.types';
export type { AnnouncementTarget };
import { useToast } from '@/components/ui/Toast';

export interface AnnouncementFilters {
  subsidiaryId?: string;
  departmentId?: string;
  target?: AnnouncementTarget;
}

/**
 * Fetch paginated announcements with filtering and infinite scroll
 */
export function useAnnouncements(filters: AnnouncementFilters = {}, pageSize = 10) {
  return useInfiniteQuery({
    queryKey: ['announcements', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.append('page', pageParam.toString());
      params.append('limit', pageSize.toString());
      if (filters.subsidiaryId) params.append('subsidiaryId', filters.subsidiaryId);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.target) params.append('target', filters.target);

      const res = await api.get<AnnouncementResponse>(`/api/announcements?${params.toString()}`);
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch pinned announcements separately (always show on top)
 */
export function usePinnedAnnouncements(filters: AnnouncementFilters = {}) {
  return useQuery({
    queryKey: ['announcements', 'pinned', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('isPinned', 'true');
      params.append('limit', '5');
      if (filters.subsidiaryId) params.append('subsidiaryId', filters.subsidiaryId);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.target) params.append('target', filters.target);

      const res = await api.get<AnnouncementResponse>(`/api/announcements?${params.toString()}`);
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch a single announcement by ID
 */
export function useAnnouncement(announcementId: string) {
  return useQuery({
    queryKey: ['announcement', announcementId],
    queryFn: async () => {
      const res = await api.get<Announcement>(`/api/announcements/${announcementId}`);
      return res.data;
    },
    enabled: !!announcementId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create a new announcement
 */
export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateAnnouncementInput) => {
      const res = await api.post<Announcement>('/api/announcements', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements', 'pinned'] });
      showToast({ title: 'Announcement posted', variant: 'success' });
    },
    onError: (error: any) => {
      showToast({
        title: 'Failed to post announcement',
        description: error?.response?.data?.message || 'An error occurred',
        variant: 'error',
      });
    },
  });
}

/**
 * Update an announcement
 */
export function useUpdateAnnouncement(announcementId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateAnnouncementInput) => {
      const res = await api.patch<Announcement>(`/api/announcements/${announcementId}`, data);
      return res.data;
    },
    onSuccess: (announcement) => {
      queryClient.setQueryData(['announcement', announcementId], announcement);
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements', 'pinned'] });
      showToast({ title: 'Announcement updated', variant: 'success' });
    },
    onError: (error: any) => {
      showToast({
        title: 'Failed to update announcement',
        description: error?.response?.data?.message || 'An error occurred',
        variant: 'error',
      });
    },
  });
}

/**
 * Delete an announcement
 */
export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (announcementId: string) => {
      await api.delete(`/api/announcements/${announcementId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements', 'pinned'] });
      showToast({ title: 'Announcement deleted', variant: 'success' });
    },
    onError: (error: any) => {
      showToast({
        title: 'Failed to delete announcement',
        description: error?.response?.data?.message || 'An error occurred',
        variant: 'error',
      });
    },
  });
}

/**
 * Toggle announcement pin status
 */
export function useToggleAnnouncementPin(announcementId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (isPinned: boolean) => {
      const res = await api.patch<Announcement>(`/api/announcements/${announcementId}/pin`, { isPinned });
      return res.data;
    },
    onSuccess: (announcement) => {
      queryClient.setQueryData(['announcement', announcementId], announcement);
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements', 'pinned'] });
      showToast({ title: announcement.isPinned ? 'Pinned to top' : 'Unpinned', variant: 'success' });
    },
    onError: (error: any) => {
      showToast({
        title: 'Failed to update announcement',
        description: error?.response?.data?.message || 'An error occurred',
        variant: 'error',
      });
    },
  });
}
