"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Bell,
  Bug,
  Building2,
  MessageSquare,
  Hash,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Inbox,
  LogOut,
  MailPlus,
  Megaphone,
  Send,
  Settings,
  Shield,
  Star,
  Trash2,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";

import { useAuthStore } from "@/store/authStore";
import { useMailStore } from "@/store/mailStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useUIStore } from "@/store/uiStore";
import Avatar from "@/components/ui/Avatar";
import type { UserRole } from "@/types/user.types";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { openBugReportEmail } from "@/lib/bugReport";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: typeof Inbox;
  badge?: number;
  roles?: UserRole[];
};

// ─── Nav definitions ──────────────────────────────────────────────────────────

const primaryNav = (unreadCount: number): NavItem[] => [
  { href: "/mail/inbox", label: "Inbox", icon: Inbox, badge: unreadCount },
  { href: "/mail/starred", label: "Starred", icon: Star },
  { href: "/mail/sent", label: "Sent", icon: Send },
  { href: "/mail/drafts", label: "Drafts", icon: FolderOpen },
  { href: "/mail/trash", label: "Trash", icon: Trash2 },
];

const secondaryNav: NavItem[] = [
  { href: "/directory", label: "Directory", icon: Users },
  { href: "/chat", label: "Messages", icon: MessageSquare },
  { href: "/channels", label: "Channels", icon: Hash },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const adminNav: NavItem[] = [
  {
    href: "/admin/users",
    label: "Users",
    icon: Shield,
    roles: ["subsidiary_admin", "group_admin"],
  },
  {
    href: "/admin/departments",
    label: "Departments",
    icon: Building2,
    roles: ["subsidiary_admin", "group_admin"],
  },
  {
    href: "/admin/subsidiaries",
    label: "Subsidiaries",
    icon: Bell,
    roles: ["group_admin"],
  },
  {
    href: "/admin/audit-logs",
    label: "Audit Logs",
    icon: Shield,
    roles: ["subsidiary_admin", "group_admin"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavSection({
  items,
  pathname,
  onNavigate,
  collapsed = false,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: (() => void) | undefined;
  collapsed?: boolean;
}) {
  return (
    <nav className="space-y-0.5" aria-label="Navigation">
      {items.map(({ href, label, icon: Icon, badge }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            {...(onNavigate ? { onClick: onNavigate } : {})}
            className={cn(
              "relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dana-blue-500/30",
              collapsed ? "justify-center" : "justify-between",
              active
                ? "bg-dana-blue-50 text-dana-blue-800 shadow-sm"
                : "hover:bg-slate-100 hover:text-slate-950",
            )}
          >
            <span className={cn("flex items-center", collapsed ? "" : "gap-3")}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span>{label}</span>}
            </span>
            {badge && !collapsed ? (
              <span className="badge-unread" aria-label={`${badge} unread`}>
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
            {badge && collapsed ? (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-dana-blue-700 text-[8px] font-bold text-white">
                {badge > 9 ? "9+" : badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function SectionLabel({ children, collapsed = false }: { children: React.ReactNode; collapsed?: boolean }) {
  if (collapsed) return <div className="my-2 h-px bg-slate-200" />;
  return (
    <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
      {children}
    </p>
  );
}

// ─── Footer user card with dropdown ──────────────────────────────────────────

function UserFooter() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const fullName = user
    ? `${user.firstName} ${user.lastName}`
    : "Current User";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="User menu"
          className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dana-blue-500/30"
        >
          <Avatar
            src={user?.avatarUrl}
            name={fullName}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {fullName}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user?.email ?? "user@danagroup.com"}
            </p>
          </div>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={8}
          className={cn(
            "z-50 w-52 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-dana-lg",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
        >
          <DropdownMenu.Item
            onSelect={() => router.push(`/directory/${user?.id}`)}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-colors hover:bg-accent focus:bg-accent"
          >
            <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            My Profile
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => router.push("/settings")}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-colors hover:bg-accent focus:bg-accent"
          >
            <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Settings
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => openBugReportEmail(user?.id, undefined, undefined, "Issue reported via user menu")}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-colors hover:bg-accent focus:bg-accent"
          >
            <Bug className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Report a bug
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            onSelect={() => void logout()}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger outline-none transition-colors hover:bg-danger-light focus:bg-danger-light"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─── Inner nav content (shared by both fixed and drawer) ─────────────────────

function SidebarContent({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const openCompose = useMailStore((s) => s.openCompose);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const visibleAdminItems = adminNav.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role)),
  );

  return (
    <div className="flex h-full flex-col">
      {/* Brand header */}
      <div className={cn("border-b border-slate-200 bg-white py-4", collapsed ? "px-2" : "px-5")}>
        <Link
          href="/mail/inbox"
          {...(onNavigate ? { onClick: onNavigate } : {})}
          className="mb-4 flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dana-blue-500/30"
          aria-label="DIMS — go to inbox"
        >
          <div className={cn("rounded-lg", collapsed ? "px-2 py-2 w-full flex justify-center" : "w-full px-4 py-2")}>
            {collapsed ? (
              <Image src={logo} width={32} height={6} alt="Dana Group logo" priority className="object-contain" />
            ) : (
              <Image src={logo} width={140} height={27} alt="Dana Group logo" priority />
            )}
          </div>
        </Link>

        {!collapsed && user?.subsidiary?.name && (
          <p className="mb-3 truncate px-1 text-[11px] font-medium uppercase tracking-widest text-slate-400">
            {user.subsidiary.name}
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            openCompose();
            onNavigate?.();
          }}
          title={collapsed ? "Compose" : undefined}
          className={cn(
            "flex w-full items-center justify-center rounded-lg bg-dana-blue-700 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-dana-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dana-blue-500/30",
            collapsed ? "px-2 py-2.5" : "gap-2 px-4 py-2.5",
          )}
        >
          <MailPlus className="h-4 w-4" aria-hidden="true" />
          {!collapsed && "Compose"}
        </button>
      </div>

      {/* Scrollable nav */}
      <div className={cn("flex-1 space-y-5 overflow-y-auto bg-white py-4 text-slate-700 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200", collapsed ? "px-2" : "px-4")}>
        <NavSection
          items={primaryNav(unreadCount)}
          pathname={pathname}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />

        <div className="space-y-2">
          <SectionLabel collapsed={collapsed}>Explore</SectionLabel>
          <NavSection items={secondaryNav} pathname={pathname} onNavigate={onNavigate} collapsed={collapsed} />
        </div>

        {visibleAdminItems.length > 0 && (
          <div className="space-y-2">
            <SectionLabel collapsed={collapsed}>Admin</SectionLabel>
            <NavSection
              items={visibleAdminItems}
              pathname={pathname}
              onNavigate={onNavigate}
              collapsed={collapsed}
            />
          </div>
        )}
      </div>

      {/* User footer */}
      <div className={cn("border-t border-slate-200 bg-white py-4", collapsed ? "px-2" : "px-5")}>
        {collapsed ? (
          <div className="flex justify-center">
            <Avatar
              src={user?.avatarUrl}
              name={user ? `${user.firstName} ${user.lastName}` : "User"}
              size="sm"
            />
          </div>
        ) : (
          <UserFooter />
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on ESC
  useEffect(() => {
    if (!sidebarOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen, setSidebarOpen]);

  // Return focus to hamburger on close (managed by AppShell via data-sidebar-trigger)
  useEffect(() => {
    if (sidebarOpen && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [sidebarOpen]);

  const handleNavigate = () => setSidebarOpen(false);

  return (
    <>
      {/* ── Desktop fixed sidebar (md+) ── */}
      <aside
        className={cn(
          "dims-sidebar fixed left-0 top-0 hidden md:flex md:flex-col transition-all duration-300",
          sidebarCollapsed && "dims-sidebar-collapsed",
        )}
        style={sidebarCollapsed ? { width: "var(--sidebar-collapsed-width)" } : undefined}
        aria-label="Primary"
      >
        <SidebarContent collapsed={sidebarCollapsed} />
        {/* Collapse toggle */}
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`absolute z-50 flex items-center justify-center rounded-full border-2 border-white/30 bg-dana-blue-700 text-white shadow-lg transition-all hover:bg-dana-blue-600 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${sidebarCollapsed ? "h-4 w-4 right-10 top-8" : "h-8 w-8 right-10 top-6"}`}
        >
          {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-6 w-6" />}
        </button>
      </aside>

      {/* ── Mobile drawer backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile slide-in drawer ── */}
      <aside
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Primary navigation"
        className={cn(
          "dims-sidebar fixed left-0 top-0 z-50 transition-transform duration-300 focus:outline-none md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent onNavigate={handleNavigate} />
      </aside>
    </>
  );
}
