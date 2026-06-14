// store/uiStore.ts — UI-only ephemeral state (sidebar open/collapsed)
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  /** Mobile drawer open state — never persisted */
  sidebarOpen: boolean;
  /** Desktop rail-collapsed mode — persisted */
  sidebarCollapsed: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "dims-ui",
      // Only persist the desktop collapsed preference; drawer state resets on refresh
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);
