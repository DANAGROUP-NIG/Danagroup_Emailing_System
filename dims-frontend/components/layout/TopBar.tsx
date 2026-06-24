"use client";

// TopBar is locked to h-16 (64px) — app/(app)/mail/[viewMode]/layout.tsx
// uses `calc(100vh - 64px)` so this height must not change.

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, MailPlus, Menu, Settings, HelpCircle, User, Loader2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { useAuthStore } from "@/store/authStore";
import { useMailStore } from "@/store/mailStore";
import { useUIStore } from "@/store/uiStore";
import { useLogout } from "@/hooks/useAuth";
import NotificationPanel from "@/components/layout/NotificationPanel";
import Avatar from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { SocketConnectionStatus } from "@/hooks/useSocket";

const SearchBar = dynamic(() => import("@/components/mail/SearchBar"), {
  ssr: false,
  loading: () => (
    <div className="h-9 w-full max-w-sm animate-pulse rounded-md bg-accent" aria-hidden="true" />
  ),
});

// ─── Route meta map ───────────────────────────────────────────────────────────

const routeLabels: Array<{ match: RegExp; title: string; subtitle: string }> = [
  { match: /^\/mail\/inbox/, title: "Inbox", subtitle: "Recent conversations and unread activity" },
  { match: /^\/mail\/sent/, title: "Sent", subtitle: "Everything you&apos;ve sent across the organisation" },
  { match: /^\/mail\/drafts/, title: "Drafts", subtitle: "Work in progress and unsent replies" },
  { match: /^\/mail\/starred/, title: "Starred", subtitle: "Messages you&apos;ve pinned for quick return" },
  { match: /^\/mail\/trash/, title: "Trash", subtitle: "Messages pending deletion or recovery" },
  { match: /^\/directory/, title: "Directory", subtitle: "People, teams, and organisational details" },
  { match: /^\/announcements/, title: "Announcements", subtitle: "Broadcast updates and company notices" },
  { match: /^\/admin\/users/, title: "User Admin", subtitle: "Manage access, roles, and employee records" },
  { match: /^\/admin\/departments/, title: "Department Admin", subtitle: "Edit department structure and ownership" },
  { match: /^\/admin\/subsidiaries/, title: "Subsidiary Admin", subtitle: "Manage subsidiary records and domains" },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface TopBarProps {
  connectionStatus?: SocketConnectionStatus;
}

export default function TopBar({ connectionStatus }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();
  const openCompose = useMailStore((s) => s.openCompose);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const showReconnecting = connectionStatus === "reconnecting";

  const handleLogout = () => {
    void logoutMutation.mutateAsync();
  };

  const routeMeta = useMemo(
    () =>
      routeLabels.find((r) => r.match.test(pathname)) ?? {
        title: "DIMS",
        subtitle: "Internal communication workspace",
      },
    [pathname],
  );

  const fullName = user ? `${user.firstName} ${user.lastName}` : "Current User";

  return (
    <header
      // h-16 = 64px — do not change; mail split layout depends on this
      className="sticky top-0 z-30 flex h-[73px] items-center gap-4 border-b-0 border-border bg-background/80 px-4 backdrop-blur md:px-6"
    >
      {/* ── Hamburger (mobile only) ── */}
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={toggleSidebar}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* ── Breadcrumb / page title ── */}
      <div className="min-w-0 flex-1 md:flex-none md:w-56">
        <p className="truncate text-[15px] font-semibold text-foreground leading-tight">
          {routeMeta.title}
        </p>
        <p className="hidden truncate text-xs text-muted-foreground md:block">
          {routeMeta.subtitle}
        </p>
      </div>

      {/* ── Search (grows in centre) ── */}
      <div className="hidden flex-1 items-center justify-center lg:flex">
        <SearchBar />
      </div>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Reconnecting indicator */}
        {showReconnecting && (
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-warning-light px-2.5 py-1 text-xs font-medium text-warning"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            <span>Reconnecting...</span>
          </div>
        )}

        {/* Compose — icon-only on <lg, full button on lg+ */}
        <button
          type="button"
          aria-label="Compose new message"
          onClick={() => openCompose()}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg font-medium text-sm transition-colors",
            "bg-primary text-primary-foreground hover:bg-primary-hover shadow-dana-sm",
            "h-9 w-9 p-0 lg:h-9 lg:w-auto lg:px-4",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
        >
          <MailPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden lg:inline">Compose</span>
        </button>

        {/* Notifications bell */}
        <NotificationPanel userId={user?.id} />

        {/* Profile dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="User account menu"
              aria-haspopup="menu"
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Avatar src={user?.avatarUrl} name={fullName} size="sm" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className={cn(
                "z-50 w-56 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-dana-lg",
                "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              )}
            >
              {/* User identity header */}
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>

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
                onSelect={() => router.push("/help")}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-colors hover:bg-accent focus:bg-accent"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Help
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-border" />

              <DropdownMenu.Item
                onSelect={handleLogout}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger outline-none transition-colors hover:bg-danger-light focus:bg-danger-light"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
