"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { getSocketBaseUrl } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";

type MailNotificationPayload = {
  notificationId?: string;
  type?: "new_mail" | "announcement" | "system";
  title?: string;
  body?: string;
  referenceId?: string;
  createdAt?: string;
};

export function useSocket(userId?: string) {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const accessToken = useAuthStore((state) => state.user?.accessToken);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = getSocketBaseUrl();

    if (!userId || !accessToken || !socketUrl) {
      setIsConnected(false);
      return;
    }

    const socket: Socket = io(`${socketUrl}/notifications`, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      auth: {
        token: accessToken,
      },
    });

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("subscribe", { room: `user:${userId}` });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("notification", (payload: MailNotificationPayload) => {
      if (payload.notificationId && payload.type && payload.title && payload.createdAt) {
        addNotification({
          id: payload.notificationId,
          userId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          isRead: false,
          referenceId: payload.referenceId,
          createdAt: payload.createdAt,
        });
      }
    });

    socket.on("new_mail", () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mail", "inbox"] }),
        queryClient.invalidateQueries({ queryKey: ["mail", "thread"] }),
      ]);
      toast.success("New mail received");
    });

    socket.on("mail_read", () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["mail"] }),
        queryClient.invalidateQueries({ queryKey: ["message"] }),
      ]);
    });

    socket.on("announcement", () => {
      void queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast("New announcement available");
    });

    socket.on("system", (payload: { message?: string }) => {
      if (payload?.message === "authentication_failed") {
        toast.error("Live updates disconnected. Please sign in again.");
      }
    });

    return () => {
      socket.disconnect();
      setIsConnected(false);
    };
  }, [accessToken, addNotification, queryClient, userId]);

  return { isConnected };
}
