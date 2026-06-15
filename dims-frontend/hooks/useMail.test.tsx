import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useInbox,
  useSent,
  useDrafts,
  useStarred,
  useTrash,
  useThread,
  useSendMail,
  useSaveDraft,
  useMarkRead,
  useStarMail,
  useDeleteMail,
  mailKeys,
} from "./useMail";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("useMail hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("mailKeys", () => {
    it("should generate correct query keys for all folder", () => {
      expect(mailKeys.all).toEqual(["mail"]);
    });

    it("should generate correct query keys for specific folders", () => {
      expect(mailKeys.folder("inbox")).toEqual(["mail", "inbox"]);
      expect(mailKeys.folder("sent")).toEqual(["mail", "sent"]);
      expect(mailKeys.folder("drafts")).toEqual(["mail", "drafts"]);
      expect(mailKeys.folder("starred")).toEqual(["mail", "starred"]);
      expect(mailKeys.folder("trash")).toEqual(["mail", "trash"]);
    });

    it("should generate correct query keys for thread", () => {
      expect(mailKeys.thread("thread-1")).toEqual(["mail", "thread", "thread-1"]);
    });

    it("should generate correct query keys for message", () => {
      expect(mailKeys.message("msg-1")).toEqual(["message", "msg-1"]);
    });

    it("should generate correct query keys for search", () => {
      expect(mailKeys.search()).toEqual(["search", "mail"]);
    });
  });

  describe("useInbox", () => {
    it("should fetch inbox threads", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useInbox(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.pages[0]?.data).toBeDefined();
    });
  });

  describe("useSent", () => {
    it("should fetch sent threads", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSent(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
    });
  });

  describe("useDrafts", () => {
    it("should fetch drafts", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDrafts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
    });
  });

  describe("useStarred", () => {
    it("should fetch starred threads", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useStarred(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
    });
  });

  describe("useTrash", () => {
    it("should fetch trash", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useTrash(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
    });
  });

  describe("useThread", () => {
    it("should fetch thread details when threadId is provided", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useThread("thread-1"), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.threadId).toBe("thread-1");
    });

    it("should not fetch when threadId is undefined", () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useThread(undefined), { wrapper });

      expect(result.current.isLoading).toBe(false);
      // Query is disabled when threadId is undefined, so it won't fetch
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  describe("useSendMail", () => {
    it("should send email successfully", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSendMail(), { wrapper });

      const composeData = {
        subject: "Test Subject",
        body: "Test body",
        toEmails: ["test@dana.com"],
      };

      await act(async () => {
        await result.current.mutateAsync(composeData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("useSaveDraft", () => {
    it("should save draft successfully", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useSaveDraft(), { wrapper });

      const draftData = {
        subject: "Draft Subject",
        body: "Draft body",
      };

      await act(async () => {
        await result.current.mutateAsync(draftData);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("useMarkRead", () => {
    it("should mark message as read with optimistic update", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useMarkRead(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("msg-1");
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("useStarMail", () => {
    it("should toggle star status with optimistic update", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useStarMail(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ id: "msg-1", isStarred: true });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe("useDeleteMail", () => {
    it("should delete mail with optimistic update", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeleteMail(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("msg-1");
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});
