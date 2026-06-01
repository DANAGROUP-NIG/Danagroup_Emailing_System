"use client";

import { Camera, LogOut, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { useAuthStore } from "@/store/authStore";
import NotificationPanel from "@/components/layout/NotificationPanel";
import Image from "next/image";
import profileImage from "@/assets/profile-image.webp"

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

   const [isOpen, setIsOpen] = useState(false);

  const routeMeta = useMemo(
    () =>
      routeLabels.find((route) => route.match.test(pathname)) ?? {
        title: "DIMS",
        subtitle: "Internal communication workspace",
      },
    [pathname],
  );

  return (
    <header className="sticky top-0 z-30 px-6 py-4 gap-[22px] border-b border-slate-200/70 bg-white/85 backdrop-blur flex flex-col justify-center">
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-slate-900">{routeMeta.title}</p>
          <p className="truncate text-sm text-slate-500">{routeMeta.subtitle}</p>
        </div>

        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="flex w-full max-w-xl items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-4 text-slate-500">
            <Search className="h-4 w-4" />
            <span className="text-sm">Search mail, people, or announcements</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NotificationPanel userId={user?.id} />

          <div className="hidden relative items-center gap-3 rounded-full border bg-slate-200 p-1 md:flex">
            <div className="group">
              <div
                onClick={() => {setIsOpen(!isOpen)}} 
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-dana-blue-600 text-xs font-semibold text-white">
                {getInitials(user?.firstName, user?.lastName)}
              </div>

              <div className={`absolute ${ !isOpen ? "group-hover:opacity-100 transition group-hover:delay-75 opacity-0" : "opacity-0" } top-14 right-0 rounded text-sm text-gray-300 font-semibold bg-gray-800/70 px-3 py-2`}>
                <div className="text-white">Manage Account</div>
                <div>{user?.firstName} {user?.lastName}</div>
                <div>{user?.email}</div>
              </div>

            </div>

            <div className={` ${isOpen ? "opacity-100" : "opacity-0"} absolute shadow-md rounded-md bg-slate-50 top-16 right-0 w-96 py-8 px-4 flex flex-col gap-3`}>

              <div className="flex flex-col justify-center items-center">

                <div>
                  <p className="truncate text-sm text-slate-500">{user?.email ?? "user@danagroup.com"}</p>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <div className="relative">
                    { user?.avatarUrl 
                    ? <Image alt="avatar" src={profileImage} width={80} height={80} className="rounded-full"/> 
                    : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-dana-blue-600 text-2xl font-semibold text-white">
                        {getInitials(user?.firstName, user?.lastName)}
                      </div>
                    }

                    <button className="absolute cu bottom-0 right-0 h-8 w-8 flex justify-center items-center rounded-full bg-gray-200">
                      <Camera />
                    </button>

                  </div>

                  <div className="text-lg font-thin">
                    Hi, <span> {user ? `${user.firstName}` : "Current User"}!</span>
                  </div>
                </div>

                <button className="rounded-full border border-gray-200 text-sm text-dana-blue-400 px-6 py-[6px]"> Manage your Account</button>

              </div>
              

              
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex shadow-sm h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>

            </div>

          </div>

          
        </div>
      </div>
      <div>
        reload and sort UIs
      </div>
    </header>
  );
}
