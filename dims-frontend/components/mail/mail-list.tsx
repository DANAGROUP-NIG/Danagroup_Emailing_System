'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Star } from 'lucide-react'
import { Email } from '@/lib/types/email'
import { useMailStore } from '@/lib/store/mail-store'
import { format } from 'date-fns'

interface MailListProps {
  emails: Email[]
  selectedId: string | null
  onSelectEmail: (id: string) => void
}

export function MailList({
  emails,
  selectedId,
  onSelectEmail,
}: MailListProps) {
  const { toggleStar } = useMailStore()

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y">
        {emails.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p>No emails found</p>
          </div>
        ) : (
          emails.map((email) => (
            <button
              key={email.id}
              onClick={() => onSelectEmail(email.id)}
              className={`w-full px-3 sm:px-4 py-3 text-left transition-all duration-200 border-l-4 ${
                selectedId === email.id
                  ? 'bg-primary/8 border-l-primary shadow-sm'
                  : 'hover:bg-muted/50 border-l-transparent hover:border-l-primary/30'
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="mt-1 hidden sm:block">
                  <Checkbox
                    checked={false}
                    onCheckedChange={(e) => {
                      e.stopPropagation()
                    }}
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleStar(email.id)
                  }}
                  className="mt-1 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                >
                  <Star
                    className={`w-4 h-4 ${
                      email.starred ? 'fill-primary text-primary' : ''
                    }`}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <p className={`font-medium text-sm truncate ${
                      selectedId === email.id ? 'text-primary' : ''
                    }`}>
                      {email.sender.name}
                    </p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {format(new Date(email.timestamp), 'h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{email.subject}</p>
                  <p className="text-xs text-muted-foreground truncate line-clamp-2">
                    {email.preview}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </ScrollArea>
  )
}
