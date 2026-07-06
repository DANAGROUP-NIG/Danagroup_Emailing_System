'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsApi } from '@/lib/api/announcements';
import type { AnnouncementListResponse } from '@/lib/api/announcements';
import type { Announcement, CreateAnnouncementInput, UpdateAnnouncementInput, AnnouncementTarget } from '@/types/announcement.types';
export type { AnnouncementTarget };
import { useToast } from '@/components/ui/Toast';

export interface AnnouncementFilters {
  subsidiaryId?: string | undefined;
  departmentId?: string | undefined;
  target?: AnnouncementTarget | undefined;
}

/**
 * Fetch paginated announcements with filtering and infinite scroll
 */
export function useAnnouncements(filters: AnnouncementFilters = {}, pageSize = 10) {
  return useInfiniteQuery({
    queryKey: ['announcements', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await announcementsApi.list({
        page: pageParam as number,
        limit: pageSize,
        ...(filters.subsidiaryId ? { subsidiaryId: filters.subsidiaryId } : {}),
        ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
        ...(filters.target ? { target: filters.target } : {}),
      });
      return res.data as AnnouncementListResponse;
    },
    getNextPageParam: (lastPage: AnnouncementListResponse) => {
      const hasNextPage = lastPage.page * lastPage.limit < lastPage.total;
      return hasNextPage ? lastPage.page + 1 : undefined;
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
      const res = await announcementsApi.list({
        isPinned: true,
        limit: 5,
        ...(filters.subsidiaryId ? { subsidiaryId: filters.subsidiaryId } : {}),
        ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
        ...(filters.target ? { target: filters.target } : {}),
      });
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
      const res = await announcementsApi.getById(announcementId);
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
      const res = await announcementsApi.create(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements', 'pinned'] });
      showToast({ title: 'Announcement posted', variant: 'success' });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : 'An error occurred';
      showToast({
        title: 'Failed to post announcement',
        description: msg,
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
      const res = await announcementsApi.update(announcementId, data);
      return res.data;
    },
    onSuccess: (announcement) => {
      queryClient.setQueryData(['announcement', announcementId], announcement);
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements', 'pinned'] });
      showToast({ title: 'Announcement updated', variant: 'success' });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : 'An error occurred';
      showToast({
        title: 'Failed to update announcement',
        description: msg,
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
      await announcementsApi.delete(announcementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements', 'pinned'] });
      showToast({ title: 'Announcement deleted', variant: 'success' });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : 'An error occurred';
      showToast({
        title: 'Failed to delete announcement',
        description: msg,
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
    mutationFn: async () => {
      const res = await announcementsApi.togglePin(announcementId);
      return res.data;
    },
    onSuccess: (announcement) => {
      queryClient.setQueryData(['announcement', announcementId], announcement);
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcements', 'pinned'] });
      showToast({ title: announcement.isPinned ? 'Pinned to top' : 'Unpinned', variant: 'success' });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : 'An error occurred';
      showToast({
        title: 'Failed to update announcement',
        description: msg,
        variant: 'error',
      });
    },
  });
}
