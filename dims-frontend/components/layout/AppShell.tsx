"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import ComposeModal from "@/components/mail/ComposeModal";
import { ToastProvider } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { useMe, useAuthSync } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";

// ─── AppShell ─────────────────────────────────────────────────────────────────

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const user = useAuthStore((s) => s.user);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const { isPending: isLoadingUser, error } = useMe();
  const [hydrated, setHydrated] = useState(false);

  // Sync auth store with server state
  useAuthSync();

  // Initialise WebSocket for the authenticated user
  const { connectionStatus } = useSocket(user);

  useEffect(() => {
    // Rehydrate the Zustand store from persist
    Promise.resolve(useAuthStore.persist.rehydrate()).finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated || isLoadingUser) return;
    if (!user || error) router.replace("/login");
  }, [isLoadingUser, hydrated, router, user, error]);

  if (!hydrated || isLoadingUser) {
    return <AppShellSkeleton />;
  }

  if (!user) {
    // Redirect in progress — render nothing to avoid flash
    return null;
  }

  return (
    <ToastProvider>
      {/* Desktop sidebar (fixed, hidden on mobile) */}
      <Sidebar />

      {/* Content area shifted by sidebar width on md+ */}
      <div
        className="flex h-[100vh] flex-col transition-[padding] duration-300 md:pl-[var(--sidebar-width)]"
        style={sidebarCollapsed ? { paddingLeft: "var(--sidebar-collapsed-width)" } : undefined}
      >
        <TopBar connectionStatus={connectionStatus} />
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? {} : { opacity: 0, y: -8 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeInOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global compose modal */}
      <ComposeModal />
    </ToastProvider>
  );
}

// ─── AppShellSkeleton ─────────────────────────────────────────────────────────

export function AppShellSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar skeleton */}
      <aside
        className="fixed left-0 top-0 hidden min-h-screen w-[var(--sidebar-width)] flex-col border-r border-white/10 bg-dana-blue-900 px-5 py-5 md:flex"
        aria-hidden="true"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl bg-white/20" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 bg-white/20" />
              <Skeleton className="h-5 w-28 bg-white/20" />
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-lg bg-white/20" />
        </div>

        <div className="mt-8 space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg bg-white/15" />
          ))}
        </div>

        <div className="mt-auto">
          <Skeleton className="h-16 w-full rounded-xl bg-white/20" />
        </div>
      </aside>

      {/* Content area skeleton */}
      <div className="flex min-h-screen flex-col md:pl-[var(--sidebar-width)]">
        {/* TopBar skeleton — h-16 matches real TopBar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <div className="space-y-1 flex-1">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="hidden h-3 w-48 md:block" />
          </div>
          <Skeleton className="hidden h-10 w-full max-w-sm rounded-full lg:block" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>

        {/* Main content skeleton */}
        <main className="flex-1 overflow-hidden p-6">
          <div className="flex h-full overflow-hidden rounded-2xl border border-border bg-card">
            {/* List pane */}
            <div className="w-[380px] shrink-0 border-r border-border p-4 xl:w-[420px]">
              <div className="mb-4 space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="mt-1 h-4 w-4 rounded" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-14" />
                        </div>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thread pane */}
            <div className="flex-1 p-8">
              <div className="mx-auto max-w-4xl space-y-6">
                <div className="space-y-3 border-b border-border pb-6">
                  <Skeleton className="h-8 w-72" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="rounded-2xl border border-border p-6">
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56" />
                      </div>
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[92%]" />
                    <Skeleton className="h-4 w-[85%]" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
