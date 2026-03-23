'use client'

import { useState } from 'react'
import { MailSidebar } from './mail-sidebar'
import { SearchBar } from './search-bar'
import { EmailList } from './email-list'
import { EmailDetail } from './email-detail'
import { useEmailStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { MenuIcon, XIcon } from 'lucide-react'

export function ResponsiveMailLayout() {
  const store = useEmailStore()
  const [showSidebar, setShowSidebar] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-64 flex-col">
        <MailSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
          <div className="fixed left-0 top-0 z-50 h-screen w-64 lg:hidden">
            <MailSidebar />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Email List */}
        <div className={`flex-1 flex flex-col ${showDetail ? 'hidden lg:flex' : ''}`}>
          {/* Mobile Menu Bar */}
          <div className="lg:hidden px-4 py-3 border-b border-border bg-white flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(true)}
              className="text-muted-foreground"
            >
              <MenuIcon size={20} />
            </Button>
            <h1 className="text-lg font-semibold">Gmail</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>

          <SearchBar />
          <EmailList />
        </div>

        {/* Email Detail - Hidden on mobile unless selected */}
        <div className={`${showDetail ? '' : 'hidden'} lg:flex lg:w-96 flex-col border-l border-border`}>
          {store.selectedThreadId && (
            <>
              {/* Mobile Back Button */}
              <div className="lg:hidden px-4 py-3 border-b border-border flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowDetail(false)
                    store.setSelectedThread(null)
                  }}
                  className="text-muted-foreground"
                >
                  <XIcon size={20} />
                </Button>
              </div>
              <EmailDetail />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
