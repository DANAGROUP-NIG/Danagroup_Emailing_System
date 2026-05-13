"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { getSocketBaseUrl } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import type { MailFolder } from "@/types/mail.types";

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
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      auth: {
        token: accessToken,
      },
    });

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

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("subscribe", { room: `user:${userId}` });
      invalidateMailbox();
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

    socket.on("new_mail", (payload?: MailboxChangedPayload) => {
      invalidateMailbox({
        ...payload,
        folders: payload?.folders?.length ? payload.folders : ["inbox"],
      });
      toast.success("New mail received");
    });

    socket.on("mailbox_changed", (payload?: MailboxChangedPayload) => {
      invalidateMailbox(payload);
    });

    socket.on("mail_read", (payload?: MailboxChangedPayload) => {
      invalidateMailbox({
        ...payload,
        folders: payload?.folders?.length
          ? payload.folders
          : ["inbox", "starred"],
      });
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
