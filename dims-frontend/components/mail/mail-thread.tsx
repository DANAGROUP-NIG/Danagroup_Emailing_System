'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ArchiveIcon,
  TrashIcon,
  ReplyIcon,
  ForwardIcon,
  MoreVerticalIcon,
  X,
} from 'lucide-react'
import { Email } from '@/lib/types/email'
import { useState } from 'react'
import { format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MailThreadProps {
  email: Email
  onClose: () => void
}

export function MailThread({ email, onClose }: MailThreadProps) {
  const [replyText, setReplyText] = useState('')
  const [showReply, setShowReply] = useState(false)

  const initials = email.sender.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-foreground truncate">{email.subject}</h2>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-muted">
                <MoreVerticalIcon className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <ArchiveIcon className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-destructive/10">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 py-4 max-w-4xl mx-auto">
          {/* Email Details */}
          <div className="mb-6 bg-muted/30 rounded-lg p-4 border">
            <div className="flex items-start gap-3 sm:gap-4 mb-4">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={email.sender.avatar} />
                <AvatarFallback className="bg-primary text-white">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {email.sender.name}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {email.sender.email}
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                    {format(new Date(email.timestamp), 'PPp')}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Email Body */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-foreground whitespace-pre-wrap text-sm sm:text-base">
                {email.body}
              </p>
            </div>

            {/* Attachments */}
            {email.attachments && email.attachments.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Attachments</p>
                <div className="space-y-2">
                  {email.attachments.map((attachment, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded border hover:bg-muted cursor-pointer"
                    >
                      <span className="text-sm">{attachment.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({attachment.size})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reply Section */}
      <div className="border-t bg-gradient-to-t from-muted/30 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90 text-white"
            onClick={() => setShowReply(!showReply)}
          >
            <ReplyIcon className="w-4 h-4" />
            Reply
          </Button>
          <Button size="sm" variant="outline" className="gap-2">
            <ForwardIcon className="w-4 h-4" />
            Forward
          </Button>
        </div>

        {showReply && (
          <div className="space-y-3 bg-card rounded-lg p-4 border">
            <Textarea
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-28 sm:min-h-32 resize-none"
            />
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowReply(false)
                  setReplyText('')
                }}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={() => setShowReply(false)}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white"
              >
                Send Reply
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
