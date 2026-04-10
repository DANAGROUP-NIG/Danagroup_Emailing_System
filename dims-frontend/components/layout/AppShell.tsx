'use client';

import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import ComposeModal from '@/components/mail/ComposeModal';
import { useSocket } from '@/hooks/useSocket';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const checkingAuth = useAuthStore((state) => state.checkingAuth);
  const [hydrated, setHydrated] = useState(false);

  useSocket(user?.id ?? '');

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
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="ml-[var(--sidebar-width)] flex min-h-screen flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
        <ComposeModal />
      </div>
    </QueryClientProvider>
  );
}
