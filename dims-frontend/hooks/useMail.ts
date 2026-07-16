"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { mailApi } from "@/lib/api/mail";
import type { BackendPageResponse } from "@/types/api.types";
import type {
  ComposeData,
  DraftMessage,
  MailFolder,
  MailThreadSummary,
  Message,
  ThreadDetail,
} from "@/types/mail.types";
import { useNotificationStore } from "@/store/notificationStore";

// ─── Types & Constants ───────────────────────────────────────────────────────

type ApiEnvelope<T> = T | { data: T };

export const supportedMailFolders: MailFolder[] = [
  "inbox",
  "sent",
  "drafts",
  "starred",
  "trash",
];

// Cache configuration
const LIST_STALE_TIME = 30_000;
const LIST_GC_TIME = 5 * 60_000;
const THREAD_STALE_TIME = 0; // Real-time for threads

function unwrapResponse<T>(payload: ApiEnvelope<T>): T {
  return (payload as { data: T })?.data ?? (payload as T);
}

// ─── Query Key Helpers ───────────────────────────────────────────────────────

export const mailKeys = {
  all: ["mail"] as const,
  folder: (folder: MailFolder) => [...mailKeys.all, folder] as const,
  thread: (id: string | undefined) => [...mailKeys.all, "thread", id] as const,
  message: (id: string) => ["message", id] as const,
  search: () => ["search", "mail"] as const,
};

// ─── Helper: Invalidate Mail Queries ─────────────────────────────────────────

function useInvalidateMail() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: mailKeys.all }),
      queryClient.invalidateQueries({ queryKey: mailKeys.search() }),
    ]);
  };
}

// ─── List Hooks (Infinite Query) ─────────────────────────────────────────────

function useMailFolderInfinite(folder: MailFolder) {
  return useInfiniteQuery<
    BackendPageResponse<MailThreadSummary | DraftMessage>,
    Error,
    InfiniteData<BackendPageResponse<MailThreadSummary | DraftMessage>>,
    ReturnType<typeof mailKeys.folder>,
    number
  >({
    queryKey: mailKeys.folder(folder),
    queryFn: async ({ pageParam = 1 }) => {
      const params = { page: pageParam, limit: 20 };
      let response;
      switch (folder) {
        case "sent":
          response = await mailApi.getSent(params);
          break;
        case "drafts":
          response = await mailApi.getDrafts(params);
          break;
        case "starred":
          response = await mailApi.getStarred(params);
          break;
        case "trash":
          response = await mailApi.getTrash(params);
          break;
        default:
          response = await mailApi.getInbox(params);
          break;
      }
      return response.data as BackendPageResponse<MailThreadSummary | DraftMessage>;
    },
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.page * lastPage.limit < lastPage.total;
      return hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: LIST_STALE_TIME,
    gcTime: LIST_GC_TIME,
    // Default refetch behavior from QueryClient config
  });
}

export function useInbox() {
  return useMailFolderInfinite("inbox");
}

export function useSent() {
  return useMailFolderInfinite("sent");
}

export function useDrafts() {
  return useMailFolderInfinite("drafts");
}

export function useStarred() {
  return useMailFolderInfinite("starred");
}

export function useTrash() {
  return useMailFolderInfinite("trash");
}

export function useMailCounts() {
  const setDraftCount = useNotificationStore((s) => s.setDraftCount);

  return useQuery({
    queryKey: ["mail", "counts"],
    queryFn: async () => {
      const response = await mailApi.getCounts();
      const drafts = response.data.drafts ?? 0;
      setDraftCount(drafts);
      return { drafts };
    },
    refetchInterval: 30000,
  });
}

// ─── Thread & Message Hooks ────────────────────────────────────────────────────

export function useThread(threadId: string | undefined) {
  return useQuery<ThreadDetail, Error>({
    queryKey: mailKeys.thread(threadId),
    queryFn: async () => {
      if (!threadId) throw new Error("Thread ID is required");
      const res = await mailApi.getThread(threadId);
      return unwrapResponse<ThreadDetail>(res.data as ApiEnvelope<ThreadDetail>);
    },
    enabled: !!threadId,
    staleTime: THREAD_STALE_TIME, // Real-time freshness for threads
  });
}

export function useMessage(messageId: string) {
  return useQuery<Message, Error>({
    queryKey: mailKeys.message(messageId),
    queryFn: async () => {
      const res = await mailApi.getMessage(messageId);
      return unwrapResponse<Message>(res.data as ApiEnvelope<Message>);
    },
    enabled: !!messageId,
    staleTime: 5 * 60 * 1000, // 5 minutes for individual messages
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useSendMail() {
  const invalidateMail = useInvalidateMail();
  return useMutation<Message, Error, ComposeData>({
    mutationFn: async (payload) => {
      const res = await mailApi.send(payload);
      return unwrapResponse<Message>(res.data as ApiEnvelope<Message>);
    },
    onSuccess: invalidateMail,
  });
}

export function useSaveDraft() {
  const invalidateMail = useInvalidateMail();
  return useMutation<Message, Error, ComposeData>({
    mutationFn: async (payload) => {
      const res = await mailApi.saveDraft(payload);
      return unwrapResponse<Message>(res.data as ApiEnvelope<Message>);
    },
    onSuccess: invalidateMail,
  });
}

export function useMarkThreadRead() {
  const invalidateMail = useInvalidateMail();
  return useMutation<void, Error, string>({
    mutationFn: async (threadId) => {
      await mailApi.markThreadRead(threadId);
    },
    onSuccess: invalidateMail,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  const invalidateMail = useInvalidateMail();

  return useMutation<Message, Error, string>({
    mutationFn: async (id) => {
      const res = await mailApi.markRead(id, true);
      return unwrapResponse<Message>(res.data as ApiEnvelope<Message>);
    },
    onMutate: async (messageId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: mailKeys.all });

      // Snapshot previous values
      const previousData = new Map<
        MailFolder,
        InfiniteData<BackendPageResponse<MailThreadSummary | DraftMessage>> | undefined
      >();

      // Optimistically update all folder caches
      supportedMailFolders.forEach((folder) => {
        const queryKey = mailKeys.folder(folder);
        const data = queryClient.getQueryData<
          InfiniteData<BackendPageResponse<MailThreadSummary | DraftMessage>>
        >(queryKey);
        previousData.set(folder, data);

        if (!data) return;

        const newPages = data.pages.map((page) => ({
          ...page,
          data: page.data.map((item) => {
            // Check if this is a thread summary with the message (MailThreadSummary has latestMessage)
            if ("latestMessage" in item && item.latestMessage?.id === messageId) {
              const threadItem = item as MailThreadSummary;
              return {
                ...threadItem,
                latestMessage: threadItem.latestMessage ? { ...threadItem.latestMessage, isRead: true } : null,
                unreadCount: Math.max(0, (threadItem.unreadCount ?? 1) - 1),
              };
            }
            return item;
          }),
        }));

        queryClient.setQueryData(queryKey, {
          ...data,
          pages: newPages,
        });
      });

      return { previousData };
    },
    onError: (_err, _messageId, context) => {
      // Rollback on error
      const ctx = context as { previousData?: Map<MailFolder, InfiniteData<BackendPageResponse<MailThreadSummary | DraftMessage>> | undefined> } | undefined;
      if (ctx?.previousData) {
        ctx.previousData.forEach((data, folder) => {
          if (data) {
            queryClient.setQueryData(mailKeys.folder(folder), data);
          }
        });
      }
    },
    onSettled: invalidateMail,
  });
}

export function useMarkUnread() {
  const invalidateMail = useInvalidateMail();

  return useMutation<Message, Error, string>({
    mutationFn: async (id) => {
      const res = await mailApi.markRead(id, false);
      return unwrapResponse<Message>(res.data as ApiEnvelope<Message>);
    },
    onSuccess: invalidateMail,
  });
}

export function useStarMail() {
  const queryClient = useQueryClient();
  const invalidateMail = useInvalidateMail();

  return useMutation<Message, Error, { id: string; isStarred: boolean }>({
    mutationFn: async ({ id, isStarred }) => {
      const res = await mailApi.toggleStar(id, isStarred);
      return unwrapResponse<Message>(res.data as ApiEnvelope<Message>);
    },
    onMutate: async ({ id, isStarred }) => {
      await queryClient.cancelQueries({ queryKey: mailKeys.all });

      const previousData = new Map<
        MailFolder,
        InfiniteData<BackendPageResponse<MailThreadSummary | DraftMessage>> | undefined
      >();

      supportedMailFolders.forEach((folder) => {
        const queryKey = mailKeys.folder(folder);
        const data = queryClient.getQueryData<
          InfiniteData<BackendPageResponse<MailThreadSummary | DraftMessage>>
        >(queryKey);
        previousData.set(folder, data);

        if (!data) return;

        const newPages = data.pages.map((page) => ({
          ...page,
          data: page.data.map((item) => {
            // Check if this is a thread summary (MailThreadSummary has latestMessage)
            if ("latestMessage" in item && item.latestMessage?.id === id) {
              const threadItem = item as MailThreadSummary;
              return {
                ...threadItem,
                isStarred,
              };
            }
            return item;
          }),
        }));

        queryClient.setQueryData(queryKey, { ...data, pages: newPages });
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      const ctx = context as { previousData?: Map<MailFolder, InfiniteData<BackendPageResponse<MailThreadSummary | DraftMessage>> | undefined> } | undefined;
      if (ctx?.previousData) {
        ctx.previousData.forEach((data, folder) => {
          if (data) {
            queryClient.setQueryData(mailKeys.folder(folder), data);
          }
        });
      }
    },
    onSettled: invalidateMail,
  });
}

export function useStarThread() {
  const queryClient = useQueryClient();
  const invalidateMail = useInvalidateMail();

  return useMutation<
    { threadId: string; messageId: string; isStarred: boolean },
    Error,
    { threadId: string; isStarred: boolean },
    {
      previousData: Map<
        MailFolder,
        InfiniteData<BackendPageResponse<MailThreadSummary | DraftMessage>> | undefined
      >;
    }
  >({
    mutationFn: async ({ threadId, isStarred }) => {
      const res = await mailApi.toggleThreadStar(threadId, isStarred);
      return unwrapResponse(res.data);
    },
    onMutate: async ({ threadId, isStarred }) => {
      await queryClient.cancelQueries({ queryKey: mailKeys.all });

      const previousData = new Map<
        MailFolder,
        InfiniteData<BackendPageResponse<MailThreadSummary | DraftMessage>> | undefined
      >();

      supportedMailFolders.forEach((folder) => {
        const queryKey = mailKeys.folder(folder);
        const data = queryClient.getQueryData<
          InfiniteData<BackendPageResponse<MailThreadSummary | DraftMessage>>
        >(queryKey);
        previousData.set(folder, data);

        if (!data) return;

        const pages = data.pages.map((page) => ({
          ...page,
          data: page.data.map((item) =>
            "latestMessage" in item && item.id === threadId
              ? { ...item, isStarred }
              : item,
          ),
        }));

        queryClient.setQueryData(queryKey, { ...data, pages });
      });

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      const previousData = context?.previousData;
      previousData?.forEach((data, folder) => {
        if (data) queryClient.setQueryData(mailKeys.folder(folder), data);
      });
    },
    onSettled: invalidateMail,
  });
}

export function useDeleteMail() {
  const queryClient = useQueryClient();
  const invalidateMail = useInvalidateMail();

  return useMutation<Message, Error, string>({
    mutationFn: async (id) => {
      const res = await mailApi.moveToTrash(id);
      return unwrapResponse<Message>(res.data as ApiEnvelope<Message>);
    },
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: mailKeys.all });

      const previousData = new Map<
        MailFolder,
        InfiniteData<BackendPageResponse<MailThreadSummary | DraftMessage>> | undefined
      >();

      supportedMailFolders.forEach((folder) => {
        if (folder === "trash") return; // Don't remove from trash

        const queryKey = mailKeys.folder(folder);
        const data = queryClient.getQueryData<
          InfiniteData<BackendPageResponse<MailThreadSummary | DraftMessage>>
        >(queryKey);
        previousData.set(folder, data);

        if (!data) return;

        const newPages = data.pages.map((page) => ({
          ...page,
          data: page.data.filter((item) => {
            // Check if this is a thread summary (MailThreadSummary has latestMessage)
            if ("latestMessage" in item) {
              const threadItem = item as MailThreadSummary;
              return threadItem.latestMessage?.id !== messageId;
            }
            return true; // Keep draft messages (they have different structure)
          }),
        }));

        queryClient.setQueryData(queryKey, { ...data, pages: newPages });
      });

      return { previousData };
    },
    onError: (_err, _messageId, context) => {
      const ctx = context as { previousData?: Map<MailFolder, InfiniteData<BackendPageResponse<MailThreadSummary | DraftMessage>> | undefined> } | undefined;
      if (ctx?.previousData) {
        ctx.previousData.forEach((data, folder) => {
          if (data) {
            queryClient.setQueryData(mailKeys.folder(folder), data);
          }
        });
      }
    },
    onSettled: invalidateMail,
  });
}

export function useRestoreMail() {
  const invalidateMail = useInvalidateMail();
  return useMutation<Message, Error, string>({
    mutationFn: async (id) => {
      const res = await mailApi.restore(id);
      return unwrapResponse<Message>(res.data as ApiEnvelope<Message>);
    },
    onSuccess: invalidateMail,
  });
}

export function useEmptyTrash() {
  const invalidateMail = useInvalidateMail();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await mailApi.emptyTrash();
    },
    onSuccess: invalidateMail,
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();
  const invalidateMail = useInvalidateMail();

  return useMutation<void, Error, string>({
    mutationFn: async (draftId) => {
      await mailApi.deleteDraft(draftId);
    },
    onMutate: async (draftId) => {
      await queryClient.cancelQueries({ queryKey: mailKeys.folder("drafts") });

      const previousData = queryClient.getQueryData<
        InfiniteData<BackendPageResponse<MailThreadSummary | DraftMessage>>
      >(mailKeys.folder("drafts"));

      if (previousData) {
        const newPages = previousData.pages.map((page) => ({
          ...page,
          data: page.data.filter((item) => (item as DraftMessage).id !== draftId),
        }));
        queryClient.setQueryData(mailKeys.folder("drafts"), {
          ...previousData,
          pages: newPages,
        });
      }

      return { previousData };
    },
    onError: (_err, _draftId, context) => {
      const ctx = context as { previousData?: InfiniteData<BackendPageResponse<MailThreadSummary | DraftMessage>> } | undefined;
      if (ctx?.previousData) {
        queryClient.setQueryData(mailKeys.folder("drafts"), ctx.previousData);
      }
    },
    onSettled: invalidateMail,
  });
}

export function usePermanentDeleteMail() {
  const invalidateMail = useInvalidateMail();
  return useMutation<Message, Error, string>({
    mutationFn: async (id) => {
      const res = await mailApi.permanentDelete(id);
      return unwrapResponse<Message>(res.data as ApiEnvelope<Message>);
    },
    onSuccess: invalidateMail,
  });
}

export function useBulkMarkRead() {
  const invalidateMail = useInvalidateMail();
  return useMutation<void, Error, string[]>({
    mutationFn: async (messageIds) => {
      await mailApi.markManyRead(messageIds);
    },
    onSuccess: invalidateMail,
  });
}

export function useReplyMail() {
  const invalidateMail = useInvalidateMail();
  return useMutation<Message, Error, { threadId: string; data: ComposeData }>({
    mutationFn: async ({ threadId, data }) => {
      const res = await mailApi.send({ ...data, threadId });
      return unwrapResponse<Message>(res.data as ApiEnvelope<Message>);
    },
    onSuccess: invalidateMail,
  });
}

export function useForwardMail() {
  const invalidateMail = useInvalidateMail();
  return useMutation<Message, Error, { messageId: string; data: ComposeData }>({
    mutationFn: async ({ data }) => {
      // Forward is essentially a new message with quoted content
      const res = await mailApi.send(data);
      return unwrapResponse<Message>(res.data as ApiEnvelope<Message>);
    },
    onSuccess: invalidateMail,
  });
}

// ─── Legacy Compatibility ─────────────────────────────────────────────────────

/**
 * @deprecated Use discrete hooks instead: useInbox(), useSent(), etc.
 */
export function useMail() {
  return {
    useInbox: (page = 1) =>
      useQuery({
        queryKey: ["mail", "inbox", "legacy", page],
        queryFn: () => mailApi.getInbox({ page }).then((r) => r.data),
        staleTime: LIST_STALE_TIME,
      }),
    useSent: (page = 1) =>
      useQuery({
        queryKey: ["mail", "sent", "legacy", page],
        queryFn: () => mailApi.getSent({ page }).then((r) => r.data),
        staleTime: LIST_STALE_TIME,
      }),
    useDrafts: (page = 1) =>
      useQuery({
        queryKey: ["mail", "drafts", "legacy", page],
        queryFn: () => mailApi.getDrafts({ page }).then((r) => r.data),
        staleTime: LIST_STALE_TIME,
      }),
    useStarred: (page = 1) =>
      useQuery({
        queryKey: ["mail", "starred", "legacy", page],
        queryFn: () => mailApi.getStarred({ page }).then((r) => r.data),
        staleTime: LIST_STALE_TIME,
      }),
    useTrash: (page = 1) =>
      useQuery({
        queryKey: ["mail", "trash", "legacy", page],
        queryFn: () => mailApi.getTrash({ page }).then((r) => r.data),
        staleTime: LIST_STALE_TIME,
      }),
    useThread: (threadId?: string) => useThread(threadId),
    useSendMail: () => useSendMail(),
    useSaveDraft: () => useSaveDraft(),
    useMarkThreadRead: () => useMarkThreadRead(),
    useMarkRead: () => useMarkRead(),
    useMarkUnread: () => useMarkUnread(),
    useStarMail: () => useStarMail(),
    useDeleteMail: () => useDeleteMail(),
    useRestoreMail: () => useRestoreMail(),
    useEmptyTrash: () => useEmptyTrash(),
    usePermanentDeleteMail: () => usePermanentDeleteMail(),
    useBulkMarkRead: () => useBulkMarkRead(),
    useGetMessage: (messageId: string) => useMessage(messageId),
  };
}
