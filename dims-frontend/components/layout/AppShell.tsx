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
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              className="min-h-full"
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
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar skeleton */}
      <aside
        className="fixed left-0 top-0 hidden min-h-screen w-[var(--sidebar-width)] flex-col border-r border-slate-200 bg-white px-5 py-5 shadow-[8px_0_28px_rgb(15_23_42_/_0.06)] md:flex"
        aria-hidden="true"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg bg-slate-200" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 bg-slate-200" />
              <Skeleton className="h-5 w-28 bg-slate-200" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-lg bg-dana-blue-100" />
        </div>

        <div className="mt-8 space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg bg-slate-100" />
          ))}
        </div>

        <div className="mt-auto">
          <Skeleton className="h-16 w-full rounded-xl bg-slate-100" />
        </div>
      </aside>

      {/* Content area skeleton */}
      <div className="flex min-h-screen flex-col md:pl-[var(--sidebar-width)]">
        {/* TopBar skeleton — h-16 matches real TopBar */}
        <header className="sticky top-0 z-30 flex h-[73px] items-center gap-4 bg-white/80 px-4 backdrop-blur md:px-6">
          <div className="min-w-0 flex-1 space-y-2 md:flex-none md:w-56">
            <Skeleton className="h-4 w-24 bg-slate-200" />
            <Skeleton className="hidden h-3 w-44 bg-slate-200 md:block" />
          </div>
          <Skeleton className="hidden h-10 w-full max-w-md rounded-lg bg-slate-200 lg:block" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg bg-slate-200" />
            <Skeleton className="h-9 w-9 rounded-full bg-slate-200" />
            <Skeleton className="h-9 w-9 rounded-full bg-slate-200" />
          </div>
        </header>

        {/* Main content skeleton */}
        <main className="flex-1 overflow-hidden bg-slate-100">
          <div className="flex h-full overflow-hidden">
            {/* List pane */}
            <div className="hidden w-[380px] shrink-0 border-r border-slate-200 bg-white p-4 xl:block xl:w-[420px]">
              <div className="mb-4 space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="mt-1 h-4 w-4 rounded bg-slate-200" />
                      <Skeleton className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Skeleton className="h-4 w-24 bg-slate-200" />
                          <Skeleton className="h-3 w-14 bg-slate-200" />
                        </div>
                        <Skeleton className="h-4 w-3/4 bg-slate-200" />
                        <Skeleton className="h-3 w-full bg-slate-100" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thread pane */}
            <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
              <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded bg-slate-200" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-6 w-72 max-w-full bg-slate-200" />
                    <Skeleton className="h-3 w-36 bg-slate-200" />
                  </div>
                  <div className="hidden items-center gap-1 md:flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-9 w-9 rounded bg-slate-200" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden px-4 py-5 lg:px-8">
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                        <Skeleton className="h-9 w-9 shrink-0 rounded-full bg-slate-200" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-40 bg-slate-200" />
                          <Skeleton className="h-3 w-56 max-w-full bg-slate-100" />
                        </div>
                        <Skeleton className="h-3 w-20 shrink-0 bg-slate-200" />
                      </div>
                      <div className="space-y-3 px-5 py-6">
                        <Skeleton className="h-4 w-full bg-slate-100" />
                        <Skeleton className="h-4 w-[92%] bg-slate-100" />
                        <Skeleton className="h-4 w-[80%] bg-slate-100" />
                        <Skeleton className="h-24 w-full rounded-lg bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
