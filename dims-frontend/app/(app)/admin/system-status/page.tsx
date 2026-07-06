"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/authStore";
import { useSocket } from "@/hooks/useSocket";
import { apiClient } from "@/lib/api/client";
import {
  Activity,
  Globe,
  Wifi,
  WifiOff,
  Server,
  Monitor,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Layers,
  Zap,
  Bug,
} from "lucide-react";
import * as Sentry from "@sentry/nextjs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HealthStatus {
  api: "online" | "offline" | "checking";
  websocket: "connected" | "disconnected" | "connecting" | "fallback";
  apiLatency?: number;
  lastChecked: Date;
}

interface BrowserInfo {
  userAgent: string;
  browser: string;
  os: string;
  locale: string;
  timezone: string;
  screenSize: string;
  colorScheme: "light" | "dark" | "no-preference";
  online: boolean;
  cookiesEnabled: boolean;
}

interface SentryStats {
  errorCount: number;
  lastEventId?: string;
  isConfigured: boolean;
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function getBrowserInfo(): BrowserInfo {
  const ua = navigator.userAgent;

  // Simple browser detection
  let browser = "Unknown";
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  // Simple OS detection
  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";

  return {
    userAgent: ua,
    browser,
    os,
    locale: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "no-preference",
    online: navigator.onLine,
    cookiesEnabled: navigator.cookieEnabled,
  };
}

// ─── Components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { color: string; icon: React.ReactNode }> = {
    online: { color: "bg-emerald-500", icon: <CheckCircle2 className="h-3 w-3" /> },
    connected: { color: "bg-emerald-500", icon: <CheckCircle2 className="h-3 w-3" /> },
    offline: { color: "bg-danger", icon: <AlertCircle className="h-3 w-3" /> },
    disconnected: { color: "bg-danger", icon: <WifiOff className="h-3 w-3" /> },
    checking: { color: "bg-warning", icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
    connecting: { color: "bg-warning", icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
    fallback: { color: "bg-blue-500", icon: <Layers className="h-3 w-3" /> },
  };

  const variant = variants[status] || { color: "bg-gray-500", icon: <Activity className="h-3 w-3" /> };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white ${variant.color}`}>
      {variant.icon}
      <span className="capitalize">{status}</span>
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function HealthDashboard() {
  const user = useAuthStore((s) => s.user);
  const { connectionStatus, isConnected } = useSocket(user);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  // API health check query
  const { data: apiHealth, isFetching: apiChecking, refetch: refetchApi } = useQuery({
    queryKey: ["system-health", "api"],
    queryFn: async () => {
      const start = performance.now();
      try {
        await apiClient.get("/health");
        const latency = Math.round(performance.now() - start);
        return { status: "online" as const, latency };
      } catch {
        return { status: "offline" as const, latency: undefined };
      }
    },
    refetchInterval: 30_000, // Check every 30 seconds
    staleTime: 0,
  });

  // Browser info
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);

  useEffect(() => {
    setBrowserInfo(getBrowserInfo());
  }, []);

  // Sentry stats
  const [sentryStats, setSentryStats] = useState<SentryStats>({
    errorCount: 0,
    isConfigured: false,
  });

  useEffect(() => {
    // Check if Sentry is configured
    const client = Sentry.getClient();
    setSentryStats({
      errorCount: 0, // Would need Sentry API access for real count
      isConfigured: !!client,
    });
  }, []);

  // Determine WebSocket status
  const wsStatus: HealthStatus["websocket"] = isConnected
    ? "connected"
    : connectionStatus === "connecting" || connectionStatus === "reconnecting"
      ? "connecting"
      : "disconnected";

  const handleTriggerError = () => {
    // Intentionally throw an error to test Sentry
    const testError = new Error("Manual test error from System Status page");
    Sentry.captureException(testError, {
      level: "info",
      tags: {
        test: "true",
        source: "system-status-page",
      },
    });
    alert("Test error sent to Sentry! Check your Sentry dashboard.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Status</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Health monitoring and diagnostic information
          </p>
        </div>
        <Button
          onClick={() => {
            void refetchApi().finally(() => setLastChecked(new Date()));
          }}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* API Status */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${apiHealth?.status === "online" ? "bg-emerald-100" : "bg-danger-light"}`}>
              <Server className={`h-5 w-5 ${apiHealth?.status === "online" ? "text-emerald-600" : "text-danger"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">API Status</p>
              <StatusBadge status={apiChecking ? "checking" : (apiHealth?.status ?? "checking")} />
            </div>
          </div>
          {apiHealth?.latency && (
            <p className="text-xs text-muted-foreground">
              Latency: {apiHealth.latency}ms
            </p>
          )}
        </Card>

        {/* WebSocket Status */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${wsStatus === "connected" ? "bg-emerald-100" : wsStatus === "connecting" ? "bg-warning-light" : "bg-danger-light"}`}>
              {wsStatus === "connected" ? (
                <Wifi className="h-5 w-5 text-emerald-600" />
              ) : (
                <WifiOff className={`h-5 w-5 ${wsStatus === "connecting" ? "text-warning" : "text-danger"}`} />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">WebSocket</p>
              <StatusBadge status={wsStatus} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Real-time notifications {wsStatus === "connected" ? "active" : "inactive"}
          </p>
        </Card>

        {/* Sentry Status */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${sentryStats.isConfigured ? "bg-emerald-100" : "bg-warning-light"}`}>
              <Bug className={`h-5 w-5 ${sentryStats.isConfigured ? "text-emerald-600" : "text-warning"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Error Tracking</p>
              <Badge variant={sentryStats.isConfigured ? "success" : "warning"}>
                {sentryStats.isConfigured ? "Active" : "Not Configured"}
              </Badge>
            </div>
          </div>
          <button
            onClick={handleTriggerError}
            className="text-xs text-primary hover:text-primary-hover underline"
          >
            Send test error
          </button>
        </Card>

        {/* Connection Type */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-dana-blue-50">
              <Zap className="h-5 w-5 text-dana-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Connection</p>
              <Badge variant={navigator.onLine ? "success" : "danger"}>
                {navigator.onLine ? "Online" : "Offline"}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(navigator as any).connection
              ? /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                `Type: ${(navigator as any).connection.effectiveType ?? "unknown"}`
              : "Network info unavailable"}
          </p>
        </Card>
      </div>

      {/* Browser & Environment Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="h-5 w-5 text-dana-blue-600" />
            <h2 className="text-lg font-semibold text-foreground">Browser & Environment</h2>
          </div>
          <div className="space-y-1">
            <InfoRow label="Browser" value={browserInfo?.browser ?? "Loading..."} />
            <InfoRow label="Operating System" value={browserInfo?.os ?? "Loading..."} />
            <InfoRow label="Screen Resolution" value={browserInfo?.screenSize ?? "Loading..."} />
            <InfoRow label="Color Scheme" value={browserInfo?.colorScheme ?? "Loading..."} />
            <InfoRow label="Locale" value={browserInfo?.locale ?? "Loading..."} />
            <InfoRow label="Timezone" value={browserInfo?.timezone ?? "Loading..."} />
            <InfoRow label="Cookies Enabled" value={browserInfo?.cookiesEnabled ? "Yes" : "No"} />
            <InfoRow
              label="User Agent"
              value={
                <span className="text-xs truncate max-w-[200px] block" title={browserInfo?.userAgent}>
                  {browserInfo?.userAgent ?? "Loading..."}
                </span>
              }
            />
          </div>
        </Card>

        {/* Application Info */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="h-5 w-5 text-dana-blue-600" />
            <h2 className="text-lg font-semibold text-foreground">Application Info</h2>
          </div>
          <div className="space-y-1">
            <InfoRow label="App Name" value={process.env.NEXT_PUBLIC_APP_NAME ?? "DIMS"} />
            <InfoRow label="Version" value={process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0"} />
            <InfoRow label="Environment" value={process.env.NODE_ENV} />
            <InfoRow label="API URL" value={process.env.NEXT_PUBLIC_API_URL ?? "Default"} />
            <InfoRow label="WebSocket URL" value={process.env.NEXT_PUBLIC_WS_URL ?? "Default"} />
            <InfoRow
              label="Last Checked"
              value={
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lastChecked.toLocaleTimeString()}
                </span>
              }
            />
            <InfoRow
              label="Sentry Configured"
              value={sentryStats.isConfigured ? "Yes" : "No"}
            />
          </div>
        </Card>
      </div>

      {/* TanStack Query DevTools */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 text-dana-blue-600" />
          <h2 className="text-lg font-semibold text-foreground">Cache & Query Stats</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          TanStack Query devtools are available below for inspecting cache state, queries, and mutations.
          Click the React Query logo in the bottom-left corner to expand.
        </p>
        <div className="bg-muted rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            DevTools floating button is active. Click the blue React Query icon in the bottom-left corner.
          </p>
        </div>
      </Card>

      {/* Network Diagnostics */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-dana-blue-600" />
          <h2 className="text-lg font-semibold text-foreground">Network Diagnostics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Protocol</p>
            <p className="text-sm font-medium text-foreground">{window.location.protocol}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Hostname</p>
            <p className="text-sm font-medium text-foreground">{window.location.hostname}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Port</p>
            <p className="text-sm font-medium text-foreground">{window.location.port || "Default"}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Wrapper with AdminGuard
export default function SystemStatusPage() {
  return (
    <AdminGuard requiredRoles={["group_admin"]}>
      <>
        <HealthDashboard />
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      </>
    </AdminGuard>
  );
}
