"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PaginatedResponse } from "@/types/api.types";
import type { ComposeData, Message, Thread } from "@/types/mail.types";

type ApiEnvelope<T> = T | { data: T };

const MAIL_STALE_TIME = 30_000;

function unwrapResponse<T>(payload: ApiEnvelope<T>): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    payload.data !== undefined
  ) {
    return payload.data;
  }

  return payload as T;
}

// TODO: Implement useInbox(page): useQuery(['mail','inbox',page]) → GET /api/mail/inbox
// TODO: Implement useSent(page): useQuery(['mail','sent',page]) → GET /api/mail/sent
// TODO: Implement useDrafts(page): useQuery(['mail','drafts',page]) → GET /api/mail/drafts
async function getMailPage(
  folder: "inbox" | "sent" | "drafts",
  page = 1,
): Promise<PaginatedResponse<Thread>> {
  const response = await api.get<ApiEnvelope<PaginatedResponse<Thread>>>(
    `/mail/${folder}`,
    {
      params: { page },
    },
  );

  return unwrapResponse(response.data);
}

// TODO: Implement useThread(threadId): useQuery(['mail','thread',threadId]) → GET /api/mail/thread/:threadId
async function getThread(threadId: string): Promise<Thread> {
  const response = await api.get<ApiEnvelope<Thread>>(`/mail/thread/${threadId}`);
  return unwrapResponse(response.data);
}

// TODO: Implement useMail hook
export function useMail() {
  const queryClient = useQueryClient();

  // TODO: Invalidate mail queries after successful mail mutations
  const invalidateMailQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["mail"] }),
      queryClient.invalidateQueries({ queryKey: ["search", "mail"] }),
    ]);
  };

  return {
    // TODO: Implement useInbox(page): useQuery(['mail','inbox',page]) → GET /api/mail/inbox
    useInbox: (page = 1) =>
      useQuery({
        queryKey: ["mail", "inbox", page],
        queryFn: () => getMailPage("inbox", page),
        staleTime: MAIL_STALE_TIME,
      }),

    // TODO: Implement useSent(page): useQuery(['mail','sent',page]) → GET /api/mail/sent
    useSent: (page = 1) =>
      useQuery({
        queryKey: ["mail", "sent", page],
        queryFn: () => getMailPage("sent", page),
        staleTime: MAIL_STALE_TIME,
      }),

    // TODO: Implement useDrafts(page): useQuery(['mail','drafts',page]) → GET /api/mail/drafts
    useDrafts: (page = 1) =>
      useQuery({
        queryKey: ["mail", "drafts", page],
        queryFn: () => getMailPage("drafts", page),
        staleTime: MAIL_STALE_TIME,
      }),

    // TODO: Implement useThread(threadId): useQuery(['mail','thread',threadId]) → GET /api/mail/thread/:threadId
    useThread: (threadId?: string) =>
      useQuery({
        queryKey: ["mail", "thread", threadId],
        queryFn: () => getThread(threadId as string),
        enabled: Boolean(threadId),
      }),

    // TODO: Implement useSendMail(): useMutation → POST /api/mail/send
    useSendMail: () =>
      useMutation({
        mutationFn: async (payload: ComposeData) => {
          const response = await api.post<ApiEnvelope<Message>>("/mail/send", payload);
          return unwrapResponse(response.data);
        },
        onSuccess: invalidateMailQueries,
      }),

    // TODO: Implement useMarkRead(id): useMutation → PATCH /api/mail/:id/read
    useMarkRead: (id: string) =>
      useMutation({
        mutationFn: async () => {
          const response = await api.patch<ApiEnvelope<Message>>(`/mail/${id}/read`);
          return unwrapResponse(response.data);
        },
        onSuccess: invalidateMailQueries,
      }),

    // TODO: Implement useStarMail(id): useMutation → PATCH /api/mail/:id/star
    useStarMail: (id: string) =>
      useMutation({
        mutationFn: async () => {
          const response = await api.patch<ApiEnvelope<Message>>(`/mail/${id}/star`);
          return unwrapResponse(response.data);
        },
        onSuccess: invalidateMailQueries,
      }),

    // TODO: Implement useDeleteMail(id): useMutation → DELETE /api/mail/:id
    useDeleteMail: (id: string) =>
      useMutation({
        mutationFn: async () => {
          const response = await api.delete<ApiEnvelope<Message>>(`/mail/${id}`);
          return unwrapResponse(response.data);
        },
        onSuccess: invalidateMailQueries,
      }),

    // TODO: Implement useSaveDraft(): useMutation → POST /api/mail/draft
    useSaveDraft: () =>
      useMutation({
        mutationFn: async (payload: ComposeData) => {
          const response = await api.post<ApiEnvelope<Message>>("/mail/draft", payload);
          return unwrapResponse(response.data);
        },
        onSuccess: invalidateMailQueries,
      }),
  };
}
