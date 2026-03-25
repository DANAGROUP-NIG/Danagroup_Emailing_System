// TODO: Implement Notification Store (Zustand)
// Ref: frontend-blueprint.md §4.2

import { create } from "zustand";
import type { AppNotification } from "@/types/api.types";

interface NotificationState {
  unreadCount: number;
  notifications: AppNotification[];
  addNotification: (notification: AppNotification) => void;
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
  markAllRead: () => set({ unreadCount: 0 }),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
