'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, startOfDay, isToday, isYesterday, isThisWeek } from 'date-fns';
import { useNotifications, useMarkNotificationRead, useMarkAllRead, type NotificationFilter } from '@/hooks/useNotifications';
import { Bell, Mail, Megaphone, Info, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AppNotification } from '@/types/api.types';

function NotificationIcon({ type }: { type: AppNotification['type'] }) {
  if (type === 'new_mail') {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light">
        <Mail className="h-5 w-5 text-primary" />
      </span>
    );
  }
  if (type === 'announcement') {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning-light">
        <Megaphone className="h-5 w-5 text-warning" />
      </span>
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
      <Info className="h-5 w-5 text-muted-foreground" />
    </span>
  );
}

function groupNotificationsByDate(notifications: AppNotification[]) {
  const groups: Record<string, AppNotification[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  };

  notifications.forEach((n) => {
    const date = new Date(n.createdAt);
    if (isToday(date)) {
      groups['Today'].push(n);
    } else if (isYesterday(date)) {
      groups['Yesterday'].push(n);
    } else if (isThisWeek(date)) {
      groups['This Week'].push(n);
    } else {
      groups['Older'].push(n);
    }
  });

  return Object.entries(groups).filter(([_, items]) => items.length > 0);
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNotifications({ filter });
  const markAsRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const allNotifications = data?.pages.flatMap((page) => page.data) || [];
  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = useCallback(
    async (notification: AppNotification) => {
      if (!notification.isRead) {
        await markAsRead.mutateAsync(notification.id);
      }

      // Navigate to source
      if (notification.type === 'new_mail') {
        router.push(`/mail/inbox${notification.referenceId ? `?thread=${notification.referenceId}` : ''}`);
      } else if (notification.type === 'announcement') {
        router.push(`/announcements?id=${notification.referenceId}`);
      }
    },
    [markAsRead, router]
  );

  const groupedNotifications = groupNotificationsByDate(allNotifications);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button onClick={() => markAllRead.mutate()} variant="outline" size="sm">
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(['all', 'unread', 'mail', 'announcements', 'system'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === f
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border border-border rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
          ))}
        </div>
      ) : allNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-foreground font-medium">No notifications yet</p>
          <p className="text-sm text-muted-foreground mt-1">Check back later for updates</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedNotifications.map(([dateGroup, notifications]) => (
            <div key={dateGroup} className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">{dateGroup}</h3>
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                      notification.isRead
                        ? 'bg-card border-border hover:bg-muted'
                        : 'bg-primary-light border-primary-light hover:bg-primary-light/70'
                    }`}
                  >
                    <NotificationIcon type={notification.type} />
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${notification.isRead ? 'font-normal text-foreground' : 'font-semibold text-foreground'}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      {notification.body && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{notification.body}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
