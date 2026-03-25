// TODO: Implement App Shell Layout
// - Authenticated route wrapper
// - Renders Sidebar + TopBar + main content area
// - Providers: TanStack Query, Zustand, WebSocket
// - Redirects to /login if not authenticated

/*export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
}*/

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Send, Bell, Menu, X, LogOut, User } from "lucide-react";

export default function MailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const email = localStorage.getItem("userEmail");

    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    setUserEmail(email || "");
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    router.push("/");
  };

  const isCompose = pathname?.includes("/compose");
  const isAnnouncements = pathname?.includes("/announcements");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900/80 backdrop-blur border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/mail/compose")}>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  DIMS
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Digital Internal Mail System
                </p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userEmail.split("@")[0]}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {userEmail}
                </p>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav
            className={`${
              mobileMenuOpen ? "flex" : "hidden"
            } sm:flex flex-col sm:flex-row gap-2 border-t border-gray-200 dark:border-gray-800 sm:border-0 pt-4 sm:pt-0`}
          >
            <button
              onClick={() => {
                router.push("/mail/compose");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition whitespace-nowrap ${
                isCompose
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Compose Email</span>
            </button>

            <button
              onClick={() => {
                router.push("/mail/announcements");
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition whitespace-nowrap ${
                isAnnouncements
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Announcements</span>
            </button>

            {/* Mobile Logout */}
            <button
              onClick={handleLogout}
              className="sm:hidden flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            DIMS v1.0 | © 2024 Digital Internal Mail System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
