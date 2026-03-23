'use client'

import { useState } from 'react'
import { MailSidebar } from '@/components/mail/mail-sidebar'
import { MailList } from '@/components/mail/mail-list'
import { MailThread } from '@/components/mail/mail-thread'
import { ComposeModal } from '@/components/mail/compose-modal'
import { SearchBar } from '@/components/mail/search-bar'
import { UserMenu } from '@/components/mail/user-menu'
import { useMailStore } from '@/lib/store/mail-store'
import { Button } from '@/components/ui/button'
import { Menu, X, ChevronLeft } from 'lucide-react'

export default function Page() {
  const [selectedMail, setSelectedMail] = useState<string | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentFolder, setCurrentFolder] = useState('inbox')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  
  const { emails } = useMailStore()

  const filteredEmails = emails.filter((email) => {
    if (email.folder !== currentFolder) return false
    if (!searchQuery) return true
    return (
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.sender.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const selectedEmail = selectedMail
    ? emails.find((e) => e.id === selectedMail)
    : null

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - Desktop visible, Mobile overlay */}
      <div className="hidden lg:block w-64 border-r flex-shrink-0">
        <MailSidebar
          currentFolder={currentFolder}
          onFolderChange={setCurrentFolder}
          onCompose={() => setShowCompose(true)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-screen w-64 bg-background border-r">
            <div className="p-4 border-b flex items-center justify-between">
              <span className="text-xl font-bold">Gmail</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <MailSidebar
              currentFolder={currentFolder}
              onFolderChange={(folder) => {
                setCurrentFolder(folder)
                setSidebarOpen(false)
              }}
              onCompose={() => {
                setShowCompose(true)
                setSidebarOpen(false)
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b bg-background flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <UserMenu />
        </div>

        {/* Email List and Thread Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email List - Always visible on desktop, conditional on mobile */}
          {(!showDetails || window.innerWidth >= 768) && (
            <div className="w-full md:w-96 border-r overflow-hidden flex flex-col flex-shrink-0">
              <MailList
                emails={filteredEmails}
                selectedId={selectedMail}
                onSelectEmail={(id) => {
                  setSelectedMail(id)
                  setShowDetails(true)
                }}
              />
            </div>
          )}

          {/* Email Details - Desktop always visible, Mobile only when selected */}
          {selectedEmail ? (
            <div className={`flex-1 overflow-hidden ${!showDetails && 'hidden md:flex'}`}>
              <div className="w-full h-full flex flex-col">
                {/* Mobile detail header */}
                {showDetails && (
                  <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b bg-muted/30 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowDetails(false)
                        setSelectedMail(null)
                      }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <p className="flex-1 truncate font-medium text-sm">
                      {selectedEmail.sender.name}
                    </p>
                  </div>
                )}
                <MailThread
                  email={selectedEmail}
                  onClose={() => {
                    setSelectedMail(null)
                    setShowDetails(false)
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium">Select an email to read</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <ComposeModal open={showCompose} onOpenChange={setShowCompose} />
    </div>
  )
}
