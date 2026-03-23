'use client'

import { useEmailStore } from '@/lib/store'
import { filterEmailsByFolder, searchEmails, truncateText, formatEmailTime, getAvatarColor } from '@/lib/email-utils'
import { Button } from '@/components/ui/button'
import { StarIcon, TrashIcon } from 'lucide-react'

export function EmailList() {
  const store = useEmailStore()

  let filteredEmails = store.emails

  // Apply folder filter
  filteredEmails = filterEmailsByFolder(filteredEmails, store.activeFolder)

  // Apply label filter
  if (store.activeLabel) {
    filteredEmails = filteredEmails.filter((email) => email.labels.includes(store.activeLabel!))
  }

  // Apply search
  filteredEmails = searchEmails(filteredEmails, store.searchQuery)

  return (
    <div className="flex-1 flex flex-col border-r border-border bg-white lg:border-r overflow-hidden">
      {/* List Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 cursor-pointer"
          />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              ⚙️
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              ↻
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{filteredEmails.length} emails</p>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No emails found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredEmails.map((email) => (
              <div
                key={email.id}
                className={`px-6 py-3 text-left hover:bg-blue-50 transition cursor-pointer flex items-center gap-3 group ${
                  store.selectedThreadId === email.threadId ? 'bg-blue-50' : ''
                }`}
                onClick={() => store.setSelectedThread(email.threadId)}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                />
                <div
                  className="opacity-0 group-hover:opacity-100 transition flex-shrink-0 cursor-pointer p-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    store.toggleEmailStar(email.id)
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <StarIcon
                    size={18}
                    className={email.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}
                  />
                </div>

                {/* Avatar */}
                <div className={`w-10 h-10 ${getAvatarColor(email.from.email)} rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                  {email.from.avatar}
                </div>

                {/* Email Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-${email.isRead ? 'normal' : 'semibold'} text-sm truncate`}>
                      {email.from.fullName}
                    </span>
                    {email.attachments.length > 0 && (
                      <span className="text-xs text-muted-foreground">📎</span>
                    )}
                  </div>
                  <p className={`text-sm ${email.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'} truncate`}>
                    {email.subject}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {truncateText(email.body, 80)}
                  </p>
                </div>

                {/* Time and Actions */}
                <div className="flex items-center gap-2 ml-2 flex-shrink-0 text-right">
                  <span className={`text-xs ${email.isRead ? 'text-muted-foreground' : 'font-semibold'}`}>
                    {formatEmailTime(email.timestamp)}
                  </span>
                  <div
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition flex-shrink-0 cursor-pointer p-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      store.deleteEmail(email.id)
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <TrashIcon size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
