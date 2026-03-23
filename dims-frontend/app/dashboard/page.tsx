'use client'

import { useEffect } from 'react'
import { SearchBar } from '@/components/search-bar'
import { EmailList } from '@/components/email-list'
import { EmailDetail } from '@/components/email-detail'
import { useEmailStore } from '@/lib/store'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

export default function DashboardPage() {
  const store = useEmailStore()

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    '/': () => {
      // Focus search
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
      searchInput?.focus()
    },
    'j': () => {
      // Next email
      const currentIndex = store.emails.findIndex(e => e.threadId === store.selectedThreadId)
      if (currentIndex < store.emails.length - 1) {
        store.setSelectedThread(store.emails[currentIndex + 1].threadId)
      }
    },
    'k': () => {
      // Previous email
      const currentIndex = store.emails.findIndex(e => e.threadId === store.selectedThreadId)
      if (currentIndex > 0) {
        store.setSelectedThread(store.emails[currentIndex - 1].threadId)
      }
    },
    's': () => {
      // Star email
      if (store.selectedThreadId) {
        const email = store.emails.find(e => e.threadId === store.selectedThreadId)
        if (email) store.toggleEmailStar(email.id)
      }
    },
    'e': () => {
      // Archive/Delete email
      if (store.selectedThreadId) {
        const email = store.emails.find(e => e.threadId === store.selectedThreadId)
        if (email) store.archiveEmail(email.id)
      }
    },
    'r': () => {
      // Reply (could trigger compose)
      // Implementation would depend on having a reply feature
    },
  })

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <SearchBar />
        <EmailList />
      </div>
      <div className="hidden lg:flex lg:w-96 flex-col border-l border-border h-full overflow-hidden">
        <EmailDetail />
      </div>
    </div>
  )
}
