'use client';

import { useRouter, usePathname } from 'next/navigation';
import { User, Lock, Bell, Palette, PenLine, Filter, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsTabs = [
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/security', label: 'Security', icon: Lock },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings/appearance', label: 'Appearance', icon: Palette },
  { href: '/settings/signature', label: 'Signature', icon: PenLine },
  { href: '/settings/mail-rules', label: 'Mail Rules', icon: Filter },
  { href: '/settings/distribution-lists', label: 'Dist. Lists', icon: Users },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Layout: Sidebar + Content */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Navigation — horizontal scrollable on mobile, vertical sidebar on lg+ */}
        <nav
          className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0 lg:w-48 lg:shrink-0 scrollbar-thin"
          aria-label="Settings navigation"
        >
          {settingsTabs.map(({ href, label, icon: Icon }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0',
                pathname === href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0 max-w-2xl pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
