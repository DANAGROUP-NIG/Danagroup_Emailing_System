"use client";

import { LogOut, Search } from "lucide-react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { useAuthStore } from "@/store/authStore";
import NotificationPanel from "@/components/layout/NotificationPanel";

const routeLabels: Array<{ match: RegExp; title: string; subtitle: string }> = [
  { match: /^\/mail\/inbox/, title: "Inbox", subtitle: "Recent conversations and unread activity" },
  { match: /^\/mail\/sent/, title: "Sent", subtitle: "Everything you've sent across the organization" },
  { match: /^\/mail\/drafts/, title: "Drafts", subtitle: "Work in progress and unsent replies" },
  { match: /^\/mail\/starred/, title: "Starred", subtitle: "Messages you've pinned for quick return" },
  { match: /^\/mail\/trash/, title: "Trash", subtitle: "Messages pending deletion or recovery" },
  { match: /^\/directory/, title: "Directory", subtitle: "People, teams, and organizational details" },
  { match: /^\/announcements/, title: "Announcements", subtitle: "Broadcast updates and company notices" },
  { match: /^\/admin\/users/, title: "User Admin", subtitle: "Manage access, roles, and employee records" },
  { match: /^\/admin\/departments/, title: "Department Admin", subtitle: "Edit department structure and ownership" },
  { match: /^\/admin\/subsidiaries/, title: "Subsidiary Admin", subtitle: "Manage subsidiary records and domains" },
];

function getInitials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "DG";
}

export default function TopBar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const routeMeta = useMemo(
    () =>
      routeLabels.find((route) => route.match.test(pathname)) ?? {
        title: "DIMS",
        subtitle: "Internal communication workspace",
      },
    [pathname],
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-6 px-6">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-slate-900">{routeMeta.title}</p>
          <p className="truncate text-sm text-slate-500">{routeMeta.subtitle}</p>
        </div>

        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="flex w-full max-w-xl items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-500">
            <Search className="h-4 w-4" />
            <span className="text-sm">Search mail, people, or announcements</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationPanel userId={user?.id} />

          <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 md:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-dana-blue-600 text-xs font-semibold text-white">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {user ? `${user.firstName} ${user.lastName}` : "Current User"}
              </p>
              <p className="truncate text-xs text-slate-500">{user?.email ?? "user@danagroup.com"}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
