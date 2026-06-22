'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/user.types';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface AdminGuardProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
}

export function AdminGuard({
  children,
  requiredRoles = ['group_admin', 'subsidiary_admin'],
}: AdminGuardProps) {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground">Not authenticated</h1>
          <p className="text-sm text-muted-foreground mt-2">Please sign in to access admin panel</p>
        </div>
      </div>
    );
  }

  if (!requiredRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-card border border-border rounded-lg p-8 max-w-md text-center shadow-dana">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground">Access Denied</h1>
          <p className="text-sm text-muted-foreground mt-2">
            You don&apos;t have permission to access this area. Only administrators can view this page.
          </p>
          <Button
            onClick={() => router.push('/mail/inbox')}
            variant="primary"
            className="mt-6 w-full"
          >
            Return to Inbox
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
