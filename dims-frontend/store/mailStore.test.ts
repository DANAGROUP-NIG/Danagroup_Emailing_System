import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMailStore } from "./mailStore";

describe("mailStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    const { result } = renderHook(() => useMailStore());
    act(() => {
      result.current.setFolder("inbox");
      result.current.resetSelection();
      result.current.closeCompose();
    });
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const { result } = renderHook(() => useMailStore());

      expect(result.current.activeFolder).toBe("inbox");
      expect(result.current.selectedThreadId).toBeNull();
      expect(result.current.selectedMessageIds).toEqual([]);
      expect(result.current.isComposeOpen).toBe(false);
      expect(result.current.composeDraftId).toBeNull();
      expect(result.current.composeDefaults).toBeNull();
    });
  });

  describe("setFolder", () => {
    it("should change active folder", () => {
      const { result } = renderHook(() => useMailStore());

      act(() => {
        result.current.setFolder("sent");
      });

      expect(result.current.activeFolder).toBe("sent");
    });

    it("should reset selected thread when changing folder", () => {
      const { result } = renderHook(() => useMailStore());

      act(() => {
        result.current.setSelectedThread("thread-1");
        result.current.toggleMessageSelection("msg-1");
        result.current.setFolder("sent");
      });

      expect(result.current.activeFolder).toBe("sent");
      expect(result.current.selectedThreadId).toBeNull();
      expect(result.current.selectedMessageIds).toEqual([]);
    });
  });

  describe("setSelectedThread", () => {
    it("should set selected thread", () => {
      const { result } = renderHook(() => useMailStore());

      act(() => {
        result.current.setSelectedThread("thread-1");
      });

      expect(result.current.selectedThreadId).toBe("thread-1");
    });

    it("should clear selected thread when setting to null", () => {
      const { result } = renderHook(() => useMailStore());

      act(() => {
        result.current.setSelectedThread("thread-1");
        result.current.setSelectedThread(null);
      });

      expect(result.current.selectedThreadId).toBeNull();
    });
  });

  describe("toggleMessageSelection", () => {
    it("should add message to selection", () => {
      const { result } = renderHook(() => useMailStore());

      act(() => {
        result.current.toggleMessageSelection("msg-1");
      });

      expect(result.current.selectedMessageIds).toContain("msg-1");
    });

    it("should remove message from selection if already selected", () => {
      const { result } = renderHook(() => useMailStore());

      act(() => {
        result.current.toggleMessageSelection("msg-1");
        result.current.toggleMessageSelection("msg-1");
      });

      expect(result.current.selectedMessageIds).not.toContain("msg-1");
    });

    it("should handle multiple selections", () => {
      const { result } = renderHook(() => useMailStore());

      act(() => {
        result.current.toggleMessageSelection("msg-1");
        result.current.toggleMessageSelection("msg-2");
        result.current.toggleMessageSelection("msg-3");
      });

      expect(result.current.selectedMessageIds).toEqual([
        "msg-1",
        "msg-2",
        "msg-3",
      ]);
    });
  });

  describe("resetSelection", () => {
    it("should clear all selected messages", () => {
      const { result } = renderHook(() => useMailStore());

      act(() => {
        result.current.toggleMessageSelection("msg-1");
        result.current.toggleMessageSelection("msg-2");
        result.current.resetSelection();
      });

      expect(result.current.selectedMessageIds).toEqual([]);
    });
  });

  describe("compose state", () => {
    it("should open compose modal", () => {
      const { result } = renderHook(() => useMailStore());

      act(() => {
        result.current.openCompose();
      });

      expect(result.current.isComposeOpen).toBe(true);
    });

    it("should open compose with draftId", () => {
      const { result } = renderHook(() => useMailStore());

      act(() => {
        result.current.openCompose("draft-1");
      });

      expect(result.current.isComposeOpen).toBe(true);
      expect(result.current.composeDraftId).toBe("draft-1");
    });

    it("should open compose with defaults", () => {
      const { result } = renderHook(() => useMailStore());
      const defaults = {
        mode: "reply" as const,
        threadId: "thread-1",
        to: "test@dana.com",
        subject: "Re: Test",
      };

      act(() => {
        result.current.openCompose(null, defaults);
      });

      expect(result.current.isComposeOpen).toBe(true);
      expect(result.current.composeDefaults).toEqual(defaults);
    });

    it("should close compose and clear state", () => {
      const { result } = renderHook(() => useMailStore());

      act(() => {
        result.current.openCompose("draft-1", {
          mode: "new" as const,
          to: "test@dana.com",
        });
        result.current.closeCompose();
      });

      expect(result.current.isComposeOpen).toBe(false);
      expect(result.current.composeDraftId).toBeNull();
      expect(result.current.composeDefaults).toBeNull();
    });

    it("should set compose draft ID", () => {
      const { result } = renderHook(() => useMailStore());

      act(() => {
        result.current.openCompose();
        result.current.setComposeDraftId("new-draft-1");
      });

      expect(result.current.composeDraftId).toBe("new-draft-1");
    });
  });

  describe("integration scenarios", () => {
    it("should handle folder switch workflow", () => {
      const { result } = renderHook(() => useMailStore());

      // Start in inbox with a thread selected
      act(() => {
        result.current.setSelectedThread("thread-1");
        result.current.toggleMessageSelection("msg-1");
      });

      expect(result.current.activeFolder).toBe("inbox");
      expect(result.current.selectedThreadId).toBe("thread-1");
      expect(result.current.selectedMessageIds).toContain("msg-1");

      // Switch to sent folder
      act(() => {
        result.current.setFolder("sent");
      });

      expect(result.current.activeFolder).toBe("sent");
      expect(result.current.selectedThreadId).toBeNull();
      expect(result.current.selectedMessageIds).toEqual([]);
    });

    it("should handle compose draft workflow", () => {
      const { result } = renderHook(() => useMailStore());

      // Open compose with reply defaults
      act(() => {
        result.current.openCompose(null, {
          mode: "reply",
          threadId: "thread-1",
          to: "sender@dana.com",
          subject: "Re: Original Subject",
        });
      });

      expect(result.current.isComposeOpen).toBe(true);
      expect(result.current.composeDefaults?.mode).toBe("reply");

      // Save draft assigns ID
      act(() => {
        result.current.setComposeDraftId("saved-draft-1");
      });

      expect(result.current.composeDraftId).toBe("saved-draft-1");

      // Close clears everything
      act(() => {
        result.current.closeCompose();
      });

      expect(result.current.isComposeOpen).toBe(false);
      expect(result.current.composeDraftId).toBeNull();
      expect(result.current.composeDefaults).toBeNull();
    });
  });
});
