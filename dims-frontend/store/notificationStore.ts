import { create } from "zustand";

interface NotificationState {
  /** Number of unread notifications — updated via WebSocket + REST polling */
  unreadCount: number;
  draftCount: number;
  setUnreadCount: (count: number) => void;
  setDraftCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: () => void;
  resetUnread: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  draftCount: 0,

  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  setDraftCount: (count) => set({ draftCount: Math.max(0, count) }),

  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnread: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  resetUnread: () => set({ unreadCount: 0 }),
}));
