"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket, SocketConnectionStatus } from "./useSocket";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { notificationsApi } from "@/lib/api/notifications";
import { getLogger } from "@/lib/logger";
import type { User } from "@/types/user.types";

/**
 * Graceful degradation for WebSocket notifications.
 * 
 * This hook provides:
 * 1. WebSocket real-time updates when available
 * 2. Automatic fallback to polling every 60s if WebSocket fails permanently
 * 3. Immediate reconnection attempts when WebSocket recovers
 * 
 * The hook tracks WebSocket connection status and only enables polling
 * when the socket has been disconnected for an extended period.
 */

const logger = getLogger({ component: "notifications-fallback" });

// Number of consecutive reconnection attempts before considering "permanent" failure
const PERMANENT_DISCONNECT_THRESHOLD = 5;
// Polling interval when in fallback mode (60 seconds)
const POLLING_INTERVAL_MS = 60_000;

interface UseNotificationsWithFallbackReturn {
  /** Current connection status */
  connectionStatus: SocketConnectionStatus | "fallback";
  /** Whether real-time updates are active */
  isRealTime: boolean;
  /** Whether fallback polling is active */
  isPolling: boolean;
  /** Force a manual refresh */
  refresh: () => void;
}

/**
 * Hook that combines WebSocket notifications with automatic polling fallback.
 * 
 * Usage:
 * ```tsx
 * function NotificationBadge() {
 *   const { isRealTime, isPolling } = useNotificationsWithFallback();
 *   return <Badge variant={isRealTime ? "success" : "warning"} />;
 * }
 * ```
 */
export function useNotificationsWithFallback(
  user: User | null | undefined
): UseNotificationsWithFallbackReturn {
  const queryClient = useQueryClient();
  const { connectionStatus, isConnected } = useSocket(user);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  // Track consecutive disconnections for fallback detection
  const disconnectCountRef = useRef(0);
  const lastConnectedRef = useRef<boolean>(false);

  // Determine if we should use fallback polling
  const shouldUseFallback =
    !isConnected && disconnectCountRef.current >= PERMANENT_DISCONNECT_THRESHOLD;

  // Polling query - only enabled when WebSocket is permanently disconnected
  const { refetch: pollNotifications } = useQuery({
    queryKey: ["notifications", "unread-count", "fallback"],
    queryFn: async () => {
      logger.info("Fetching unread count via fallback polling");
      const response = await notificationsApi.unreadCount();
      const count = response.data?.count ?? 0;
      setUnreadCount(count);
      return count;
    },
    // Only poll when WebSocket is in permanent disconnect state
    enabled: shouldUseFallback && !!user,
    refetchInterval: POLLING_INTERVAL_MS,
    staleTime: POLLING_INTERVAL_MS / 2,
    retry: 2,
  });

  // Track WebSocket connection state changes
  useEffect(() => {
    if (isConnected) {
      // WebSocket reconnected - reset disconnect counter
      if (!lastConnectedRef.current) {
        logger.info("WebSocket reconnected - disabling fallback polling");
        disconnectCountRef.current = 0;

        // Invalidate to trigger fresh WebSocket-driven updates
        void queryClient.invalidateQueries({
          queryKey: ["notifications", "unread-count"],
        });
      }
    } else if (connectionStatus === "disconnected") {
      // Increment disconnect counter
      disconnectCountRef.current++;

      if (disconnectCountRef.current === PERMANENT_DISCONNECT_THRESHOLD) {
        logger.warn(
          { disconnectCount: disconnectCountRef.current },
          "WebSocket appears permanently disconnected - activating polling fallback"
        );
      }
    }

    lastConnectedRef.current = isConnected;
  }, [isConnected, connectionStatus, queryClient]);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (isConnected) {
      // Refresh via WebSocket-triggered invalidation
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    } else {
      // Manual poll refresh
      void pollNotifications();
    }
  }, [isConnected, queryClient, pollNotifications]);

  // Determine effective status
  const effectiveStatus: SocketConnectionStatus | "fallback" = shouldUseFallback
    ? "fallback"
    : connectionStatus;

  return {
    connectionStatus: effectiveStatus,
    isRealTime: isConnected,
    isPolling: shouldUseFallback,
    refresh,
  };
}

/**
 * Hook specifically for the unread notification count badge.
 * Combines WebSocket real-time updates with fallback polling.
 */
export function useNotificationCount(): {
  count: number;
  isLoading: boolean;
  connectionStatus: SocketConnectionStatus | "fallback";
} {
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  // Enable fallback polling
  const { connectionStatus } = useNotificationsWithFallback(user);

  // Base query for initial load (WebSocket handles updates)
  const { isLoading } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const response = await notificationsApi.unreadCount();
      return response.data?.count ?? 0;
    },
    // Initial fetch only - WebSocket handles updates
    staleTime: Infinity,
    enabled: !!user,
  });

  return {
    count: unreadCount,
    isLoading,
    connectionStatus,
  };
}
