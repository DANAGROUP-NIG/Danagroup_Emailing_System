import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { OfflineRetryButton } from "./OfflineRetryButton";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">You&apos;re offline</h1>
        <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
          Reconnect to the network to send and receive messages.
          Your cached inbox shell is shown below — content will refresh automatically when you&apos;re back online.
        </p>
      </div>

      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-4 text-left space-y-3"
        role="status"
        aria-label="Cached inbox shell"
      >
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <div className="h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Offline — reconnect to refresh
          </span>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 opacity-40">
            <div className="mt-1 h-4 w-4 rounded bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-3 w-40 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>

      <OfflineRetryButton />
    </div>
  );
}
