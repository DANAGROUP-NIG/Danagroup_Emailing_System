"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Info, Mail, Megaphone, X } from "lucide-react";
import api from "@/lib/api";
import { useNotificationStore } from "@/store/notificationStore";
import type { AppNotification } from "@/types/api.types";

function timeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function NotificationIcon({ type }: { type: AppNotification["type"] }) {
  if (type === "new_mail") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dana-blue-50">
        <Mail className="h-4 w-4 text-dana-blue-600" />
      </span>
    );
  }
  if (type === "announcement") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50">
        <Megaphone className="h-4 w-4 text-amber-500" />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
      <Info className="h-4 w-4 text-slate-500" />
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
      className={`group w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
        !notification.isRead ? "bg-dana-blue-50/30" : ""
      }`}
    >
      <NotificationIcon type={notification.type} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-snug ${
              notification.isRead
                ? "font-normal text-slate-600"
                : "font-semibold text-slate-900"
            }`}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-dana-red-500" />
          )}
        </div>

        {notification.body ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
            {notification.body}
          </p>
        ) : null}

        <p className="mt-1 text-[10px] font-medium text-slate-400">
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
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface NotificationPanelProps {
  userId?: string;
}

export default function NotificationPanel({ userId }: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const storeNotifications = useNotificationStore((s) => s.notifications);
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const markAllReadStore = useNotificationStore((s) => s.markAllRead);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const res = await api.get<{
        data: AppNotification[];
        total: number;
        page: number;
        limit: number;
      }>("/notifications?limit=30");
      return res.data;
    },
    enabled: isOpen && !!userId,
    staleTime: 0,
  });

  useEffect(() => {
    if (data?.data) {
      setNotifications(data.data);
    }
  }, [data, setNotifications]);

  useEffect(() => {
    if (!isOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const serverIds = new Set((data?.data ?? []).map((n) => n.id));
  const realtimeOnly = storeNotifications.filter((n) => !serverIds.has(n.id));
  const allNotifications = [...realtimeOnly, ...(data?.data ?? storeNotifications)];

  const markAllRead = useCallback(async () => {
    try {
      await api.patch("/notifications/read-all");
      markAllReadStore();
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      // silent — count will re-sync on next connect
    }
  }, [markAllReadStore, queryClient]);

  const handleClick = useCallback(
    async (notification: AppNotification) => {
      if (!notification.isRead) {
        try {
          await api.patch(`/notifications/${notification.id}/read`);
          setNotifications(
            allNotifications.map((n) =>
              n.id === notification.id ? { ...n, isRead: true } : n,
            ),
          );
          setUnreadCount(Math.max(0, unreadCount - 1));
        } catch {
          // silent
        }
      }

      setIsOpen(false);

      if (notification.type === "new_mail") {
        router.push("/mail/inbox");
      } else if (notification.type === "announcement") {
        router.push("/announcements");
      }
    },
    [allNotifications, setNotifications, setUnreadCount, unreadCount, router],
  );

  const displayBadge = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <div ref={panelRef} className="relative">
      {/* ── Bell button ── */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
          isOpen
            ? "border-dana-blue-300 bg-dana-blue-50 text-dana-blue-700"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        }`}
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-dana-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white ring-2 ring-white">
            {displayBadge}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 w-[380px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-dana-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-dana-red-50 px-2 py-0.5 text-[10px] font-semibold text-dana-red-600">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-dana-blue-600 transition hover:bg-dana-blue-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[440px] overflow-y-auto scrollbar-thin">
            {isLoading ? (
              <LoadingSkeleton />
            ) : allNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <Bell className="h-6 w-6 text-slate-400" />
                </span>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600">
                    No notifications yet
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    You&apos;ll be notified when something arrives
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {allNotifications.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    onRead={handleClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {allNotifications.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
              <p className="text-center text-[11px] text-slate-400">
                Showing {allNotifications.length} most recent notification
                {allNotifications.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
