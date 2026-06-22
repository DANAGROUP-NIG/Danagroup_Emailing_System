"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export type NotificationPermission = "default" | "granted" | "denied";

interface BrowserNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
  onClick?: () => void;
}

interface UseBrowserNotificationsReturn {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  showNotification: (options: BrowserNotificationOptions) => void;
  isSupported: boolean;
}

/**
 * Hook to manage browser notifications with permission handling.
 * Requests permission once on mount if not already decided.
 */
export function useBrowserNotifications(): UseBrowserNotificationsReturn {
  const router = useRouter();
  const permissionRef = useRef<NotificationPermission>("default");
  const isSupported =
    typeof window !== "undefined" && "Notification" in window;

  // Initialize permission state
  useEffect(() => {
    if (!isSupported) return;

    permissionRef.current = Notification.permission as NotificationPermission;

    // Auto-request permission if not yet decided
    if (permissionRef.current === "default") {
      void requestPermission();
    }
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return "denied";

    try {
      const result = await Notification.requestPermission();
      permissionRef.current = result as NotificationPermission;
      return permissionRef.current;
    } catch {
      return "denied";
    }
  }, [isSupported]);

  const showNotification = useCallback(
    (options: BrowserNotificationOptions) => {
      if (!isSupported) return;
      if (permissionRef.current !== "granted") return;
      if (document.visibilityState === "visible") return;

      const { title, body, icon, tag, data, onClick } = options;

      // Build options object conditionally to satisfy exactOptionalPropertyTypes
      const notificationOptions: NotificationOptions = {
        icon: icon ?? "/icon-192x192.png",
        requireInteraction: false,
      };
      if (body !== undefined) notificationOptions.body = body;
      if (tag !== undefined) notificationOptions.tag = tag;
      if (data !== undefined) notificationOptions.data = data;

      const notification = new Notification(title, notificationOptions);

      notification.onclick = () => {
        // Focus the tab
        window.focus();
        notification.close();

        // Execute custom click handler if provided
        onClick?.();
      };

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);
    },
    [isSupported],
  );

  return {
    permission: permissionRef.current,
    requestPermission,
    showNotification,
    isSupported,
  };
}

/**
 * Hook specifically for DIMS mail notifications.
 * Shows desktop notifications when new mail arrives and tab is hidden.
 */
export function useMailNotifications() {
  const router = useRouter();
  const { permission, showNotification, isSupported } =
    useBrowserNotifications();

  const notifyNewMail = useCallback(
    ({
      senderName,
      subject,
      threadId,
    }: {
      senderName?: string;
      subject?: string;
      threadId?: string;
    }) => {
      if (!isSupported || permission !== "granted") return;

      showNotification({
        title: senderName ? `New mail from ${senderName}` : "New mail received",
        body: subject || "You have a new message",
        tag: threadId ? `mail-${threadId}` : "new-mail",
        data: { threadId, type: "new_mail" },
        onClick: () => {
          if (threadId) {
            router.push(`/mail/inbox?thread=${threadId}`);
          } else {
            router.push("/mail/inbox");
          }
        },
      });
    },
    [isSupported, permission, showNotification, router],
  );

  const notifyAnnouncement = useCallback(
    ({
      title,
      announcementId,
    }: {
      title?: string;
      announcementId?: string;
    }) => {
      if (!isSupported || permission !== "granted") return;

      showNotification({
        title: "New announcement",
        body: title || "A new announcement has been posted",
        tag: announcementId ? `announcement-${announcementId}` : "new-announcement",
        data: { announcementId, type: "announcement" },
        onClick: () => {
          if (announcementId) {
            router.push(`/announcements?id=${announcementId}`);
          } else {
            router.push("/announcements");
          }
        },
      });
    },
    [isSupported, permission, showNotification, router],
  );

  return {
    notifyNewMail,
    notifyAnnouncement,
    isSupported,
    permission,
  };
}
