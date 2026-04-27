// TODO: Implement Sidebar Component
// - Fixed left navigation panel using .dims-sidebar CSS class
// - Dana Group logo at the top (dana-blue background)
// - Navigation links: Inbox (with unread badge), Sent, Drafts, Starred, Trash
// - Secondary links: Directory, Announcements
// - Admin links (role-gated): Users, Departments, Subsidiaries
// - "Compose" button (Dana blue, full width) using mailStore.openCompose
// - Current user avatar + name at the bottom
// - Active route highlighted using dana-blue-600 bg
// - Uses notificationStore for unread count badge
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useMailStore } from '@/store/mailStore';
import { useNotificationStore } from '@/store/notificationStore';
import type { UserRole } from '@/types/user.types';
import {
  Bell,
  Building2,
  FolderOpen,
  Inbox,
  MailPlus,
  Megaphone,
  Send,
  Shield,
  Star,
  Trash2,
  Users,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: typeof Inbox;
  badge?: number;
  roles?: UserRole[];
};

const primaryNav = (unreadCount: number): NavItem[] => [
  { href: '/mail/inbox', label: 'Inbox', icon: Inbox, badge: unreadCount },
  { href: '/mail/sent', label: 'Sent', icon: Send },
  { href: '/mail/drafts', label: 'Drafts', icon: FolderOpen },
  { href: '/mail/starred', label: 'Starred', icon: Star },
  { href: '/mail/trash', label: 'Trash', icon: Trash2 },
];

const secondaryNav: NavItem[] = [
  { href: '/directory', label: 'Directory', icon: Users },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
];

const adminNav: NavItem[] = [
  {
    href: '/admin/users',
    label: 'Users',
    icon: Shield,
    roles: ['subsidiary_admin', 'group_admin'],
  },
  {
    href: '/admin/departments',
    label: 'Departments',
    icon: Building2,
    roles: ['subsidiary_admin', 'group_admin'],
  },
  {
    href: '/admin/subsidiaries',
    label: 'Subsidiaries',
    icon: Bell,
    roles: ['group_admin'],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'DG';
}

function NavSection({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {items.map(({ href, label, icon: Icon, badge }) => {
        const active = isActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-dana-blue-600 text-white' : 'text-blue-50/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </span>
            {badge ? (
              <span className="badge-unread">{badge > 99 ? '99+' : badge}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const openCompose = useMailStore((state) => state.openCompose);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  const visibleAdminItems = adminNav.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <aside className="dims-sidebar fixed left-0 top-0">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/mail/inbox" onClick={onNavigate} className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-base font-semibold text-white">
              DG
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100/80">
                Dana Group
              </p>
              <p className="text-lg font-semibold text-white">DIMS Mail</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => {
              console.log("Compose button clicked");
              openCompose();
              onNavigate?.();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-dana-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-dana-blue-700"
          >
            <MailPlus className="h-4 w-4" />
            Compose
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent ">
          <NavSection items={primaryNav(unreadCount)} pathname={pathname} onNavigate={onNavigate} />

          <div className="space-y-3">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/60">
              Explore
            </p>
            <NavSection items={secondaryNav} pathname={pathname} onNavigate={onNavigate} />
          </div>

          {visibleAdminItems.length > 0 ? (
            <div className="space-y-3">
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/60">
                Admin
              </p>
              <NavSection items={visibleAdminItems} pathname={pathname} onNavigate={onNavigate} />
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user ? `${user.firstName} ${user.lastName}` : 'Current User'}
              </p>
              <p className="truncate text-xs text-blue-100/70">
                {user?.email ?? 'user@danagroup.com'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
