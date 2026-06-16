"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { getSocketBaseUrl } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useMailNotifications } from "@/hooks/useBrowserNotifications";
import type { MailFolder } from "@/types/mail.types";
import type { User } from "@/types/user.types";

type MailNotificationPayload = {
  notificationId?: string;
  type?: "new_mail" | "announcement" | "system";
  title?: string;
  body?: string;
  referenceId?: string;
  createdAt?: string;
};

type MailboxChangedPayload = {
  action?: string;
  messageId?: string;
  messageIds?: string[];
  threadId?: string;
  threadIds?: string[];
  folders?: MailFolder[];
};

const mailFolders: MailFolder[] = [
  "inbox",
  "sent",
  "drafts",
  "starred",
  "trash",
];

export type SocketConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

interface UseSocketReturn {
  socket: Socket | null;
  connectionStatus: SocketConnectionStatus;
  isConnected: boolean;
}

export function useSocket(user: User | null | undefined): UseSocketReturn {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] =
    useState<SocketConnectionStatus>("disconnected");
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { notifyNewMail, notifyAnnouncement } = useMailNotifications();

  const userId = user?.id;
  const subsidiaryId = user?.subsidiaryId;
  const departmentId = user?.departmentId;

  useEffect(() => {
    const socketUrl = getSocketBaseUrl();

    if (!userId || !socketUrl) {
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");

    const socket: Socket = io(`${socketUrl}/notifications`, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      withCredentials: true,
      transports: ["websocket"],
    });

    socketRef.current = socket;

    const invalidateMailbox = (payload?: MailboxChangedPayload) => {
      const folders =
        payload?.folders?.filter((folder): folder is MailFolder =>
          mailFolders.includes(folder),
        ) ?? mailFolders;

      const folderInvalidations = folders.map((folder) =>
        queryClient.invalidateQueries({ queryKey: ["mail", folder] }),
      );

      const threadInvalidations = [
        payload?.threadId
          ? queryClient.invalidateQueries({
              queryKey: ["mail", "thread", payload.threadId],
            })
          : queryClient.invalidateQueries({ queryKey: ["mail", "thread"] }),
        ...(payload?.threadIds ?? []).map((threadId) =>
          queryClient.invalidateQueries({
            queryKey: ["mail", "thread", threadId],
          }),
        ),
      ];

      const messageInvalidations = [
        payload?.messageId
          ? queryClient.invalidateQueries({
              queryKey: ["message", payload.messageId],
            })
          : undefined,
        ...(payload?.messageIds ?? []).map((messageId) =>
          queryClient.invalidateQueries({ queryKey: ["message", messageId] }),
        ),
      ].filter((promise): promise is Promise<void> => Boolean(promise));

      void Promise.all([
        ...folderInvalidations,
        ...threadInvalidations,
        ...messageInvalidations,
        queryClient.invalidateQueries({ queryKey: ["search", "mail"] }),
      ]);
    };

    // Track reconnection state
    let reconnectTimer: NodeJS.Timeout | null = null;

    socket.on("connect", () => {
      setConnectionStatus("connected");
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      // Subscribe to user room
      socket.emit("subscribe", { room: `user:${userId}` });

      // Subscribe to subsidiary room for announcement broadcasts
      if (subsidiaryId) {
        socket.emit("subscribe", { room: `subsidiary:${subsidiaryId}` });
      }

      // Subscribe to department room for department-specific broadcasts
      if (departmentId) {
        socket.emit("subscribe", { room: `department:${departmentId}` });
      }

      // Invalidate queries to catch up on missed events during disconnect
      invalidateMailbox();
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    });

    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

    socket.io.on("reconnect_attempt", () => {
      setConnectionStatus("reconnecting");
      // Show reconnecting indicator after 5 seconds of attempting
      reconnectTimer = setTimeout(() => {
        if (socket.disconnected) {
          setConnectionStatus("reconnecting");
        }
      }, 5000);
    });

    socket.on("notification", (payload: MailNotificationPayload) => {
      // Invalidate notification queries to trigger refetch
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
      // Show toast for new notification
      if (payload.title) {
        toast(payload.title, { icon: "🔔" });
      }
    });

    socket.on("new_mail", (payload?: MailboxChangedPayload) => {
      // Invalidate inbox and notifications
      invalidateMailbox({
        ...payload,
        folders: payload?.folders?.length ? payload.folders : ["inbox"],
      });
      // Invalidate notification queries for unread count update
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });

      // Show desktop notification if tab is hidden
      if (payload?.threadId) {
        notifyNewMail({ threadId: payload.threadId });
      } else {
        notifyNewMail({});
      }

      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("[Socket] new_mail received", payload);
      }
    });

    socket.on("mailbox_changed", (payload?: MailboxChangedPayload) => {
      invalidateMailbox(payload);
    });

    socket.on("mail_read", (payload?: MailboxChangedPayload) => {
      // Invalidate the affected folder(s) and unread count
      invalidateMailbox({
        ...payload,
        folders: payload?.folders?.length
          ? payload.folders
          : ["inbox", "starred"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    });

    socket.on("announcement", (payload?: { title?: string; announcementId?: string }) => {
      void queryClient.invalidateQueries({ queryKey: ["announcements"] });
      // Also invalidate notification queries
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      toast("New announcement available");

      // Show desktop notification if tab is hidden
      const announcementProps: { title?: string; announcementId?: string } = {};
      if (payload?.title) announcementProps.title = payload.title;
      if (payload?.announcementId) announcementProps.announcementId = payload.announcementId;
      notifyAnnouncement(announcementProps);
    });

    socket.on("system", (payload: { message?: string }) => {
      if (payload?.message === "authentication_failed") {
        toast.error("Live updates disconnected. Please sign in again.");
      }
    });

    return () => {
      // Unsubscribe from all rooms before disconnecting
      if (socket.connected) {
        socket.emit("unsubscribe", { room: `user:${userId}` });
        if (subsidiaryId) {
          socket.emit("unsubscribe", { room: `subsidiary:${subsidiaryId}` });
        }
        if (departmentId) {
          socket.emit("unsubscribe", { room: `department:${departmentId}` });
        }
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      socket.disconnect();
      socketRef.current = null;
      setConnectionStatus("disconnected");
    };
  }, [queryClient, userId, subsidiaryId, departmentId, notifyNewMail, notifyAnnouncement]);

  return {
    socket: socketRef.current,
    connectionStatus,
    isConnected: connectionStatus === "connected",
  };
}
