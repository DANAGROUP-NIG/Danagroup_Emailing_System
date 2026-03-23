'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboardIcon, UsersIcon, SettingsIcon, BarChart3Icon, ArrowLeftIcon } from 'lucide-react'
import { useState } from 'react'

interface AdminSidebarProps {
  active: 'dashboard' | 'users' | 'settings' | 'analytics'
}

export function AdminSidebar({ active }: AdminSidebarProps) {
  return (
    <div className="w-64 bg-sidebar border-r border-border h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        <nav className="space-y-2">
          <Link href="/admin">
            <button
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition ${
                active === 'dashboard'
                  ? 'bg-blue-100 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <LayoutDashboardIcon size={18} />
              <span>Dashboard</span>
            </button>
          </Link>

          <Link href="/admin/users">
            <button
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition ${
                active === 'users'
                  ? 'bg-blue-100 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <UsersIcon size={18} />
              <span>Users</span>
            </button>
          </Link>

          <Link href="/admin/analytics">
            <button
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition ${
                active === 'analytics'
                  ? 'bg-blue-100 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <BarChart3Icon size={18} />
              <span>Analytics</span>
            </button>
          </Link>

          <Link href="/admin/settings">
            <button
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition ${
                active === 'settings'
                  ? 'bg-blue-100 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <SettingsIcon size={18} />
              <span>Settings</span>
            </button>
          </Link>
        </nav>
      </div>

      {/* Back to App */}
      <div className="p-4 border-t border-border">
        <Link href="/dashboard">
          <Button variant="outline" className="w-full justify-start gap-2">
            <ArrowLeftIcon size={16} />
            Back to App
          </Button>
        </Link>
      </div>
    </div>
  )
}
