import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useUIStore } from "./uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    // Reset store state by rendering and resetting
    const { result } = renderHook(() => useUIStore());
    act(() => {
      result.current.setSidebarOpen(false);
      // Reset collapsed state by toggling if needed
      if (result.current.sidebarCollapsed) {
        result.current.toggleSidebarCollapsed();
      }
    });
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.sidebarOpen).toBe(false);
      expect(result.current.sidebarCollapsed).toBe(false);
    });
  });

  describe("setSidebarOpen", () => {
    it("should open sidebar", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSidebarOpen(true);
      });

      expect(result.current.sidebarOpen).toBe(true);
    });

    it("should close sidebar", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSidebarOpen(true);
        result.current.setSidebarOpen(false);
      });

      expect(result.current.sidebarOpen).toBe(false);
    });
  });

  describe("toggleSidebar", () => {
    it("should toggle sidebar from closed to open", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarOpen).toBe(true);
    });

    it("should toggle sidebar from open to closed", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setSidebarOpen(true);
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarOpen).toBe(false);
    });

    it("should toggle sidebar multiple times", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.toggleSidebar(); // false -> true
        result.current.toggleSidebar(); // true -> false
        result.current.toggleSidebar(); // false -> true
      });

      expect(result.current.sidebarOpen).toBe(true);
    });
  });

  describe("toggleSidebarCollapsed", () => {
    it("should toggle collapsed state from false to true", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.toggleSidebarCollapsed();
      });

      expect(result.current.sidebarCollapsed).toBe(true);
    });

    it("should toggle collapsed state from true to false", () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.toggleSidebarCollapsed();
        result.current.toggleSidebarCollapsed();
      });

      expect(result.current.sidebarCollapsed).toBe(false);
    });

    it("should persist collapsed state across toggles", () => {
      const { result } = renderHook(() => useUIStore());

      // First render - collapsed is false
      expect(result.current.sidebarCollapsed).toBe(false);

      // Toggle to true
      act(() => {
        result.current.toggleSidebarCollapsed();
      });

      expect(result.current.sidebarCollapsed).toBe(true);
    });
  });

  describe("persistence behavior", () => {
    it("should persist sidebarCollapsed across state changes", () => {
      const { result } = renderHook(() => useUIStore());

      // Set collapsed to true
      act(() => {
        result.current.toggleSidebarCollapsed();
      });

      expect(result.current.sidebarCollapsed).toBe(true);

      // Open sidebar (mobile state)
      act(() => {
        result.current.setSidebarOpen(true);
      });

      // Collapsed should remain true (different from open)
      expect(result.current.sidebarCollapsed).toBe(true);
      expect(result.current.sidebarOpen).toBe(true);
    });

    it("should maintain separate states for open and collapsed", () => {
      const { result } = renderHook(() => useUIStore());

      // Set mobile drawer open
      act(() => {
        result.current.setSidebarOpen(true);
      });

      // Collapse desktop rail
      act(() => {
        result.current.toggleSidebarCollapsed();
      });

      // Both states should be independent
      expect(result.current.sidebarOpen).toBe(true);
      expect(result.current.sidebarCollapsed).toBe(true);
    });
  });
});
