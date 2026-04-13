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

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const checkingAuth = useAuthStore((state) => state.checkingAuth);
  const [hydrated, setHydrated] = useState(false);

  // useSocket();

  useEffect(() => {
    Promise.resolve(useAuthStore.persist.rehydrate()).finally(() => {
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated || checkingAuth) {
      return;
    }

    if (!user) {
      router.replace('/login');
    }
  }, [checkingAuth, hydrated, router, user]);

  if (!hydrated || checkingAuth) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-[var(--sidebar-width)] flex min-h-screen flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <ComposeModal />

    </div>
  );
}
