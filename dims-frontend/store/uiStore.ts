// store/uiStore.ts — UI-only ephemeral state (sidebar open/collapsed)
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  /** Mobile drawer open state — never persisted */
  sidebarOpen: boolean;
  /** Desktop rail-collapsed mode — persisted */
  sidebarCollapsed: boolean;
  splitPaneMode: "none" | "vertical" | "horizontal";
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;
  setSplitPaneMode: (mode: "none" | "vertical" | "horizontal") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      splitPaneMode: "none",

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSplitPaneMode: (mode) => set({ splitPaneMode: mode }),
    }),
    {
      name: "dims-ui",
      // Only persist the desktop collapsed preference and split pane mode
      partialize: (state) => ({ 
        sidebarCollapsed: state.sidebarCollapsed,
        splitPaneMode: state.splitPaneMode,
      }),
    },
  ),
);
