'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Info, Mail, Megaphone, X, ChevronRight } from 'lucide-react';
import { useNotifications, useMarkNotificationRead, useMarkAllRead, useUnreadCount } from '@/hooks/useNotifications';
import { timeAgo } from '@/lib/utils';
import type { AppNotification } from '@/types/api.types';

function NotificationIcon({ type }: { type: AppNotification['type'] }) {
  if (type === 'new_mail') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light">
        <Mail className="h-4 w-4 text-primary" />
      </span>
    );
  }
  if (type === 'announcement') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning-light">
        <Megaphone className="h-4 w-4 text-warning" />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
      <Info className="h-4 w-4 text-muted-foreground" />
    </span>
  );
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (n: AppNotification) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onRead(notification)}
      className={`group w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted ${
        !notification.isRead ? 'bg-primary-light/30' : ''
      }`}
    >
      <NotificationIcon type={notification.type} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-snug ${
              notification.isRead ? 'font-normal text-foreground' : 'font-semibold text-foreground'
            }`}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>

        {notification.body ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {notification.body}
          </p>
        ) : null}

        <p className="mt-1 text-[10px] font-medium text-muted-foreground">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-px py-1">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface NotificationPanelProps {
  userId?: string | undefined;
}

export default function NotificationPanel({ userId: _userId }: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: unreadCountData } = useUnreadCount();
  const { data, isLoading } = useNotifications({ filter: 'all' });
  const markAsRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const unreadCount = unreadCountData || 0;
  const allNotifications = data?.pages.flatMap((page) => page.data).slice(0, 10) || [];

  useEffect(() => {
    if (!isOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const handleClick = useCallback(
    async (notification: AppNotification) => {
      if (!notification.isRead) {
        await markAsRead.mutateAsync(notification.id);
      }

      setIsOpen(false);

      if (notification.type === 'new_mail') {
        router.push(notification.referenceId ? `/mail/inbox/${notification.referenceId}` : '/mail/inbox');
      } else if (notification.type === 'announcement') {
        router.push(`/announcements?id=${notification.referenceId}`);
      }
    },
    [markAsRead, router]
  );

  const displayBadge = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
          isOpen
            ? 'border-primary bg-primary-light text-primary'
            : 'border-border bg-card text-foreground hover:border-border hover:bg-muted'
        }`}
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-semibold text-white ring-2 ring-card">
            {displayBadge}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 w-96 overflow-hidden rounded-lg border border-border bg-card shadow-dana-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary-light"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              {allNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear all notifications? This will mark all as read.')) {
                      markAllRead.mutate();
                    }
                  }}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Clear all notifications"
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <LoadingSkeleton />
            ) : allNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Bell className="h-6 w-6 text-muted-foreground" />
                </span>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">No notifications</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">You&apos;re all caught up</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {allNotifications.map((n) => (
                  <NotificationRow key={n.id} notification={n} onRead={handleClick} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {allNotifications.length > 0 && (
            <div className="border-t border-border bg-muted/50 px-4 py-2.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notifications');
                }}
                className="flex items-center justify-center gap-2 w-full text-center text-xs font-medium text-primary hover:text-primary-hover transition"
              >
                View all notifications
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

