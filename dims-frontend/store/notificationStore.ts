// TODO: Implement Notification Store (Zustand)
// Ref: frontend-blueprint.md §4.2

import { create } from "zustand";
import type { AppNotification } from "@/types/api.types";

interface NotificationState {
  unreadCount: number;
  notifications: AppNotification[];
  addNotification: (notification: AppNotification) => void;
  setNotifications: (notifications: AppNotification[]) => void;
  markAllRead: () => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount: 0,
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  setNotifications: (notifications) => set({ notifications }),
  markAllRead: () =>
    set((state) => ({
      unreadCount: 0,
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    })),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
