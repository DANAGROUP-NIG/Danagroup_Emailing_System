
// TODO: Implement useInbox(page): useQuery(['mail','inbox',page]) → GET /api/mail/inbox
// TODO: Implement useSent(page): useQuery(['mail','sent',page]) → GET /api/mail/sent
// TODO: Implement useDrafts(page): useQuery(['mail','drafts',page]) → GET /api/mail/drafts
// TODO: Implement useThread(threadId): useQuery(['mail','thread',threadId]) → GET /api/mail/thread/:threadId
// TODO: Implement useMail hook
// TODO: Invalidate mail queries after successful mail mutations
// TODO: Implement useSendMail(): useMutation → POST /api/mail/send
// TODO: Implement useMarkRead(id): useMutation → PATCH /api/mail/:id/read
// TODO: Implement useStarMail(id): useMutation → PATCH /api/mail/:id/star
// TODO: Implement useDeleteMail(id): useMutation → DELETE /api/mail/:id

// TODO: Implement useSaveDraft(): useMutation → POST /api/mail/draft


"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PaginatedResponse } from "@/types/api.types";
import type {
  ComposeData,
  DraftMessage,
  MailFolder,
  MailThreadSummary,
  Message,
  ThreadDetail,
} from "@/types/mail.types";

type ApiEnvelope<T> = T | { data: T };
const MAIL_STALE_TIME = 30_000;
export const supportedMailFolders: MailFolder[] = [
  "inbox",
  "sent",
  "drafts",
  "starred",
  "trash",
];

function unwrapResponse<T>(payload: any): T {
  return payload?.data ?? payload;
}

/** 
 * Helper for paginated folder fetching 
 */
async function getMailPage(
  folder: MailFolder,
  page = 1,
): Promise<PaginatedResponse<MailThreadSummary | DraftMessage>> {
  const response = await api.get(`/mail/${folder}`, {
    params: { page }
  });

  return unwrapResponse(response.data);
}

export function useMail() {
  const queryClient = useQueryClient();

  const invalidateMail = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["mail"] }),
      queryClient.invalidateQueries({ queryKey: ["search", "mail"] }),
    ]);
  };

  return {
    // --- QUERIES ---
    useInbox: (page = 1) =>
      useQuery({
        queryKey: ["mail", "inbox", page],
        queryFn: () => getMailPage("inbox", page),
        staleTime: MAIL_STALE_TIME,
      }),

    useSent: (page = 1) =>
      useQuery({
        queryKey: ["mail", "sent", page],
        queryFn: () => getMailPage("sent", page),
        staleTime: MAIL_STALE_TIME,
      }),

    useDrafts: (page = 1) =>
      useQuery({
        queryKey: ["mail", "drafts", page],
        queryFn: () => getMailPage("drafts", page),
        staleTime: MAIL_STALE_TIME,
      }),

    useStarred: (page = 1) =>
      useQuery({
        queryKey: ["mail", "starred", page],
        queryFn: () => getMailPage("starred", page),
        staleTime: MAIL_STALE_TIME,
      }),

    useTrash: (page = 1) =>
      useQuery({
        queryKey: ["mail", "trash", page],
        queryFn: () => getMailPage("trash", page),
        staleTime: MAIL_STALE_TIME,
      }),

  // Fetches full thread and marks all messages within it as read
  useThread: (threadId?: string) =>
    useQuery<ThreadDetail>({
    queryKey: ["mail", "thread", threadId],
    queryFn: async () => {
      if (!threadId) throw new Error("Thread ID is required");

      const res = await api.get(`/mail/threads/${threadId}`);

      if (!res) throw new Error("No data returned from server");

      return res.data.data;
    },
    enabled: !!threadId,
  }),

    // --- MUTATIONS ---
    
    // Sending & Drafts
    useSendMail: () =>
      useMutation({
        mutationFn: async (payload: ComposeData) => {
          const res = await api.post<ApiEnvelope<Message>>("/mail/send", payload);
          return unwrapResponse(res.data);
        },
        onSuccess: invalidateMail,
      }),

    useSaveDraft: () =>
      useMutation({
        mutationFn: async (payload: ComposeData) => {
          const res = await api.post<ApiEnvelope<Message>>("/mail/draft", payload);
          return unwrapResponse(res.data);
        },
        onSuccess: invalidateMail,
      }),

    // Single Message Actions
    useGetMessage: (messageId: string) => 
      useQuery<Message>({
        queryKey: ['message', messageId],
        queryFn: async () => {
          // Using your 'api' instance and unwrapResponse for consistency
          const res = await api.get<ApiEnvelope<Message>>(`/mail/messages/${messageId}`);
          return unwrapResponse(res.data);
        },
        enabled: !!messageId, // Only runs if messageId is truthy
        staleTime: 300000,    // 5 minutes
      }),  

    // Thread Actions
    useMarkThreadRead: () =>
      useMutation({
        mutationFn: (threadId: string) => api.patch(`/mail/threads/${threadId}/read`),
        onSuccess: invalidateMail,
      }),

    // Single Message Actions
    useMarkRead: () =>
      useMutation({
        mutationFn: async (id: string) => {
          const res = await api.patch<ApiEnvelope<Message>>(`/mail/messages/${id}/read`, {
            isRead: true,
          });
          return unwrapResponse(res.data);
        },
        onSuccess: invalidateMail,
      }),

    useStarMail: () =>
      useMutation({
        mutationFn: async ({
          id,
          isStarred,
        }: {
          id: string;
          isStarred: boolean;
        }) => {
          const res = await api.patch<ApiEnvelope<Message>>(`/mail/${id}/star`, {
            isStarred,
          });
          return unwrapResponse(res.data);
        },
        onSuccess: invalidateMail,
      }),

    // Trash & Deletion
    useDeleteMail: () =>
      useMutation({
        mutationFn: async (id: string) => {
          const res = await api.delete<ApiEnvelope<Message>>(`/mail/${id}`);
          return unwrapResponse(res.data);
        },
        onSuccess: invalidateMail,
      }),

    useRestoreMail: () =>
      useMutation({
        mutationFn: async (id: string) => {
          const res = await api.patch<ApiEnvelope<Message>>(`/mail/${id}/restore`);
          return unwrapResponse(res.data);
        },
        onSuccess: invalidateMail,
      }),

    useEmptyTrash: () =>
      useMutation({
        mutationFn: () => api.delete("/mail/trash/empty"),
        onSuccess: invalidateMail,
      }),

    // Bulk Actions
    useBulkMarkRead: () =>
      useMutation({
        mutationFn: (messageIds: string[]) =>
          api.patch("/mail/messages/read", { messageIds }),
        onSuccess: invalidateMail,
      }),
  };
}
