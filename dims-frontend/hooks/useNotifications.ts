import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { AppNotification, PaginatedResponse } from '@/types/api.types';

export type NotificationFilter = 'all' | 'unread' | 'mail' | 'announcements' | 'system';

interface UseNotificationsOptions {
  filter?: NotificationFilter;
}

/**
 * Fetch notifications with infinite scroll
 */
export function useNotifications(options?: UseNotificationsOptions) {
  return useInfiniteQuery({
    queryKey: ['notifications', options?.filter || 'all'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get<PaginatedResponse<AppNotification>>('/notifications', {
        params: {
          page: pageParam,
          limit: 20,
          ...(options?.filter && options.filter !== 'all' && { filter: options.filter }),
        },
      });
      return response.data;
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.page < lastPage.lastPage ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}

/**
 * Get unread notification count with automatic refetch
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await api.get<{ count: number }>('/notifications/unread-count');
      return response.data.count;
    },
    refetchInterval: 30000, // Refetch every 30s as fallback to WS
  });
}

/**
 * Mark single notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}
