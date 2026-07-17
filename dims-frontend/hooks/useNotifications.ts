import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import { useNotificationStore } from '@/store/notificationStore';
import type { AppNotification, BackendPageResponse } from '@/types/api.types';

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
      const response = await notificationsApi.list({
        page: pageParam as number,
        limit: 20,
      });
      return response.data as BackendPageResponse<AppNotification>;
    },
    getNextPageParam: (lastPage: BackendPageResponse<AppNotification>) => {
      const hasMore = lastPage.page * lastPage.limit < lastPage.total;
      return hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30_000,
  });
}

/**
 * Get unread notification count with automatic refetch
 */
export function useUnreadCount() {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await notificationsApi.unreadCount();
      const count = response.data.count ?? 0;
      setUnreadCount(count);
      return count;
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
      await notificationsApi.markRead(notificationId);
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
      await notificationsApi.markAllRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

/**
 * Delete all notifications
 */
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await notificationsApi.deleteAll();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}
