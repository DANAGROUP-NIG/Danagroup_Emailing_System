"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery, type QueryFunctionContext } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { getSocketBaseUrl } from "@/lib/api";
import { chatApi } from "@/lib/api/chat";
import { useAuthStore } from "@/store/authStore";
import type { ChatConversation, ChatMessage } from "@/types/chat.types";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const chatKeys = {
  conversations: ["chat", "conversations"] as const,
  messages: (convId: string) => ["chat", "messages", convId] as const,
  unread: ["chat", "unread"] as const,
};

// ─── Conversations ─────────────────────────────────────────────────────────────

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations,
    queryFn: () => chatApi.listConversations().then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useGetOrCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipientId: string) =>
      chatApi.getOrCreateConversation(recipientId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations });
    },
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function useMessages(conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId ?? ""),
    queryFn: async ({ pageParam }: QueryFunctionContext<readonly ["chat", "messages", string], string | undefined>) => {
      const data = await chatApi
        .getMessages(conversationId!, { ...(pageParam ? { before: pageParam } : {}), limit: 30 })
        .then((r) => r.data);
      return data;
    },
    getNextPageParam: (firstPage: ChatMessage[]) =>
      firstPage.length === 30 ? firstPage[0]?.createdAt : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!conversationId,
    staleTime: 10_000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recipientId, body }: { recipientId: string; body: string }) =>
      chatApi.sendMessage(recipientId, body).then((r) => r.data),
    onSuccess: (msg) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(msg.conversationId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations });
    },
  });
}

export function useMarkChatRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => chatApi.markRead(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations });
      queryClient.invalidateQueries({ queryKey: chatKeys.unread });
    },
  });
}

export function useChatUnreadCount() {
  return useQuery({
    queryKey: chatKeys.unread,
    queryFn: () => chatApi.getUnreadCount().then((r) => r.data.count),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

export function useChatSocket(activeConversationId: string | null) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleIncomingMessage = useCallback(
    (msg: ChatMessage) => {
      queryClient.setQueryData<ReturnType<typeof useMessages>["data"]>(
        chatKeys.messages(msg.conversationId),
        (old) => {
          if (!old) return old;
          const firstPage = old.pages[0] ?? [];
          const alreadyExists = firstPage.some((m) => m.id === msg.id);
          if (alreadyExists) return old;
          return {
            ...old,
            pages: [[...firstPage, msg], ...old.pages.slice(1)],
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations });
      queryClient.invalidateQueries({ queryKey: chatKeys.unread });
    },
    [queryClient],
  );

  const handleRead = useCallback(
    ({ conversationId }: { conversationId: string }) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
    },
    [queryClient],
  );

  useEffect(() => {
    if (!user?.id) return;

    const base = getSocketBaseUrl();
    if (!base) return;

    const socket = io(`${base}/chat`, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      withCredentials: true,
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("chat:message", handleIncomingMessage);
    socket.on("chat:read", handleRead);

    return () => {
      socket.off("chat:message", handleIncomingMessage);
      socket.off("chat:read", handleRead);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user?.id, handleIncomingMessage, handleRead]);

  const sendViaSocket = useCallback(
    (recipientId: string, body: string): boolean => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("chat:send", { recipientId, body });
        return true;
      }
      return false;
    },
    [],
  );

  const markReadViaSocket = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("chat:read", { conversationId });
    }
  }, []);

  return { isConnected, sendViaSocket, markReadViaSocket };
}
