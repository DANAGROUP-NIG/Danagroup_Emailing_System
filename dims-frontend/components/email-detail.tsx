'use client'

import { useEmailStore } from '@/lib/store'
import { formatEmailTime, getAvatarColor, formatFileSize } from '@/lib/email-utils'
import { Button } from '@/components/ui/button'
import {
  StarIcon,
  TrashIcon,
  ReplyIcon,
  ForwardIcon,
  MoreVerticalIcon,
  FileIcon,
  XIcon,
  ArchiveIcon,
  AlertCircleIcon,
} from 'lucide-react'
import { useState } from 'react'

export function EmailDetail() {
  const store = useEmailStore()
  const [isReplying, setIsReplying] = useState(false)

  const thread = store.threads.find((t) => t.id === store.selectedThreadId)
  const email = thread?.emails[0] // Get first email in thread

  if (!email || !thread) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-muted-foreground">
        <p>Select an email to view</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Detail Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => store.setSelectedThread(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            ←
          </Button>
          <h2 className="text-lg font-semibold truncate">{email.subject}</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => store.toggleEmailStar(email.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <StarIcon
              size={18}
              className={email.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => store.archiveEmail(email.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArchiveIcon size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => store.markAsSpam(email.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <AlertCircleIcon size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => store.deleteEmail(email.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <TrashIcon size={18} />
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <MoreVerticalIcon size={18} />
          </Button>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* From Section */}
        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-border">
          <div className={`w-12 h-12 ${getAvatarColor(email.from.email)} rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0`}>
            {email.from.avatar}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div>
                <h3 className="font-semibold text-foreground">{email.from.fullName}</h3>
                <p className="text-sm text-muted-foreground">{email.from.email}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatEmailTime(email.timestamp)}
              </span>
            </div>

            {/* To Section */}
            <div className="text-xs text-muted-foreground">
              to <span className="text-foreground">{email.to.email}</span>
            </div>
          </div>
        </div>

        {/* Message Body */}
        <div className="prose prose-sm max-w-none mb-6 whitespace-pre-wrap text-foreground">
          {email.body}
        </div>

        {/* Attachments */}
        {email.attachments.length > 0 && (
          <div className="mb-6 pb-6 border-t border-border pt-6">
            <h4 className="text-sm font-semibold mb-3">Attachments</h4>
            <div className="space-y-2">
              {email.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                  <FileIcon size={20} className="text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.filename}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-blue-600">
                    ↓
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Labels */}
        {email.labels.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {email.labels.map((labelId) => {
              const label = store.labels.find((l) => l.id === labelId)
              return (
                <div
                  key={labelId}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: label?.color || '#2563eb',
                    color: 'white',
                  }}
                >
                  {label?.name}
                  <button
                    onClick={() => store.removeEmailFromLabel(email.id, labelId)}
                    className="hover:opacity-75"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reply Section */}
      <div className="px-6 py-4 border-t border-border">
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => setIsReplying(!isReplying)}
            className="gap-2 bg-primary text-primary-foreground hover:bg-blue-600"
          >
            <ReplyIcon size={16} />
            Reply
          </Button>
          <Button variant="outline" className="gap-2">
            <ForwardIcon size={16} />
            Forward
          </Button>
        </div>

        {isReplying && (
          <div className="bg-gray-50 rounded-lg p-4">
            <textarea
              placeholder="Type your reply..."
              className="w-full p-3 border border-border rounded bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            />
            <div className="flex gap-2 mt-3">
              <Button className="bg-primary text-primary-foreground hover:bg-blue-600">
                Send
              </Button>
              <Button variant="outline" onClick={() => setIsReplying(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
