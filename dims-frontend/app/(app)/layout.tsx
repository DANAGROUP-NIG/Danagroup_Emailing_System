// TODO: Implement App Shell Layout
// - Authenticated route wrapper
// - Renders Sidebar + TopBar + main content area
// - Providers: TanStack Query, Zustand, WebSocket
// - Redirects to /login if not authenticated
'use client';

import { useEffect, useState } from 'react';
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import ComposeModal from '@/components/mail/ComposeModal';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const checkingAuth = useAuthStore((state) => state.checkingAuth);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [hydrated, setHydrated] = useState(false);

  useSocket(user?.id);

  useEffect(() => {
    Promise.resolve(useAuthStore.persist.rehydrate())
      .then(() => checkAuth())
      .finally(() => {
        setHydrated(true);
      });
  }, [checkAuth]);

  useEffect(() => {
    if (!hydrated || checkingAuth) {
      return;
    }

    if (!user) {
      router.replace('/login');
    }
  }, [checkingAuth, hydrated, router, user]);

  if (!hydrated || checkingAuth) {
    return <AppShellSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <div className="ml-[280px] flex min-h-screen flex-col">
        <TopBar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
      <ComposeModal />
    </div>
  );
}

function AppShellSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed left-0 top-0 flex min-h-screen w-[280px] flex-col border-r border-white/10 bg-dana-blue-900 px-5 py-5">
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

        <div className="mt-8 space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-10 w-full rounded-lg bg-white/15"
            />
          ))}
        </div>

        <div className="mt-auto">
          <Skeleton className="h-16 w-full rounded-xl bg-white/20" />
        </div>
      </aside>

      <div className="ml-[280px] flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="hidden h-11 w-full max-w-xl rounded-full lg:block" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="hidden h-11 w-44 rounded-full md:block" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden p-6">
          <div className="flex h-full overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="w-[380px] shrink-0 border-r border-slate-200 p-4 xl:w-[420px]">
              <div className="mb-4 space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div key={index} className="rounded-xl border border-slate-100 p-4">
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

            <div className="flex-1 p-8">
              <div className="mx-auto max-w-4xl space-y-6">
                <div className="space-y-3 border-b border-slate-200 pb-6">
                  <Skeleton className="h-8 w-72" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="rounded-2xl border border-slate-200 p-6">
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
