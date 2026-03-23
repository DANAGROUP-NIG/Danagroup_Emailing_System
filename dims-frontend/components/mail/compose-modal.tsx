'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useMailStore } from '@/lib/store/mail-store'
import { PaperclipIcon, SendIcon, Minus, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ComposeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ComposeModal({ open, onOpenChange }: ComposeModalProps) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  const { addEmail } = useMailStore()

  const handleSend = async () => {
    if (!to || !subject || !body) {
      alert('Please fill in all fields')
      return
    }

    setIsSending(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    addEmail({
      id: Math.random().toString(36).substr(2, 9),
      folder: 'sent',
      sender: {
        name: 'You',
        email: 'john@email.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
      },
      recipients: [{ name: to, email: to }],
      subject,
      body,
      preview: body.substring(0, 100),
      timestamp: new Date().toISOString(),
      starred: false,
      read: true,
      attachments: [],
    })

    setIsSending(false)
    setTo('')
    setSubject('')
    setBody('')
    onOpenChange(false)
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          onClick={() => setIsMinimized(false)}
          className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-lg"
        >
          <span className="text-sm font-medium">
            {subject || 'New Message'}
          </span>
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full mx-4 sm:max-w-2xl rounded-lg">
        {/* Header with minimize and close buttons */}
        <div className="flex items-center justify-between -mx-6 -mt-6 px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
          <DialogTitle className="text-lg font-semibold">Compose Email</DialogTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
              className="hover:bg-muted"
              title="Minimize"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="hover:bg-destructive/10 hover:text-destructive"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* To */}
          <div>
            <Input
              placeholder="To"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border-0 border-b rounded-none px-0 focus-visible:ring-0 text-base"
            />
          </div>

          <Separator className="my-0" />

          {/* Subject */}
          <div>
            <Input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border-0 border-b rounded-none px-0 focus-visible:ring-0 text-base font-medium"
            />
          </div>

          <Separator className="my-0" />

          {/* Body */}
          <div>
            <Textarea
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="border-0 rounded-none resize-none px-0 focus-visible:ring-0 min-h-48 sm:min-h-64"
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between pt-4 gap-4">
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <PaperclipIcon className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Attach files</DropdownMenuItem>
                  <DropdownMenuItem>Drive</DropdownMenuItem>
                  <DropdownMenuItem>Photos</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-none"
              >
                Discard
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending || !to || !subject || !body}
                className="flex-1 sm:flex-none gap-2 bg-primary hover:bg-primary/90"
              >
                <SendIcon className="w-4 h-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
