"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type QueryFunctionContext,
} from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { getSocketBaseUrl } from "@/lib/api";
import { channelsApi } from "@/lib/api/channels";
import { useAuthStore } from "@/store/authStore";
import type { Channel, ChannelMessage, CreateChannelInput } from "@/types/channel.types";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const channelKeys = {
  mine: ["channels", "mine"] as const,
  public: ["channels", "public"] as const,
  detail: (id: string) => ["channels", id] as const,
  messages: (id: string) => ["channels", "messages", id] as const,
};

// ─── Channels ─────────────────────────────────────────────────────────────────

export function useMyChannels() {
  return useQuery({
    queryKey: channelKeys.mine,
    queryFn: () => channelsApi.listMine().then((r) => r.data),
    staleTime: 30_000,
  });
}

export function usePublicChannels() {
  return useQuery({
    queryKey: channelKeys.public,
    queryFn: () => channelsApi.listPublic().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useChannel(id: string | null) {
  return useQuery({
    queryKey: channelKeys.detail(id ?? ""),
    queryFn: () => channelsApi.getById(id!).then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChannelInput) =>
      channelsApi.create(payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.mine });
      queryClient.invalidateQueries({ queryKey: channelKeys.public });
    },
  });
}

export function useJoinChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => channelsApi.join(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: channelKeys.mine }),
  });
}

export function useLeaveChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => channelsApi.leave(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: channelKeys.mine }),
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function useChannelMessages(channelId: string | null) {
  return useInfiniteQuery({
    queryKey: channelKeys.messages(channelId ?? ""),
    queryFn: async ({
      pageParam,
    }: QueryFunctionContext<readonly ["channels", "messages", string], string | undefined>) => {
      return channelsApi
        .getMessages(channelId!, { ...(pageParam ? { before: pageParam } : {}), limit: 30 })
        .then((r) => r.data);
    },
    getNextPageParam: (firstPage: ChannelMessage[]) =>
      firstPage.length === 30 ? firstPage[0]?.createdAt : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!channelId,
    staleTime: 10_000,
  });
}

export function useMarkChannelRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => channelsApi.markRead(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.mine });
      queryClient.invalidateQueries({ queryKey: channelKeys.messages(id) });
    },
  });
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

export function useChannelsSocket(activeChannelId: string | null) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleIncomingMessage = useCallback(
    (msg: ChannelMessage) => {
      queryClient.setQueryData<ReturnType<typeof useChannelMessages>["data"]>(
        channelKeys.messages(msg.channelId),
        (old) => {
          if (!old) return old;
          const firstPage = old.pages[0] ?? [];
          if (firstPage.some((m) => m.id === msg.id)) return old;
          return { ...old, pages: [[...firstPage, msg], ...old.pages.slice(1)] };
        },
      );
      queryClient.invalidateQueries({ queryKey: channelKeys.mine });
    },
    [queryClient],
  );

  useEffect(() => {
    if (!user?.id) return;

    const base = getSocketBaseUrl();
    if (!base) return;

    const socket = io(`${base}/channels`, {
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
    socket.on("channel:message", handleIncomingMessage);

    return () => {
      socket.off("channel:message", handleIncomingMessage);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user?.id, handleIncomingMessage]);

  const sendViaSocket = useCallback((channelId: string, body: string): boolean => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("channel:send", { channelId, body });
      return true;
    }
    return false;
  }, []);

  const joinViaSocket = useCallback((channelId: string) => {
    socketRef.current?.emit("channel:join", { channelId });
  }, []);

  const markReadViaSocket = useCallback((channelId: string) => {
    socketRef.current?.emit("channel:read", { channelId });
  }, []);

  return { isConnected, sendViaSocket, joinViaSocket, markReadViaSocket };
}
