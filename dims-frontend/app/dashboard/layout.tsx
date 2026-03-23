'use client'

import { useState } from 'react'
import { MailSidebar } from '@/components/mail-sidebar'
import { Button } from '@/components/ui/button'
import { MenuIcon } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 flex-col border-r border-border overflow-y-auto">
        <MailSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
          <div className="fixed left-0 top-0 z-50 h-screen w-64 overflow-y-auto">
            <MailSidebar />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Menu Button */}
        <div className="lg:hidden px-4 py-3 border-b border-border bg-background flex items-center flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(true)}
            className="text-muted-foreground"
          >
            <MenuIcon size={20} />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
