'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { XIcon, PaperclipIcon, SendIcon, PaletteIcon } from 'lucide-react'

interface ComposeModalProps {
  isOpen: boolean
  onClose: () => void
  onSend?: (email: { to: string; subject: string; body: string }) => void
}

export function ComposeModal({ isOpen, onClose, onSend }: ComposeModalProps) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)

  const handleSend = () => {
    if (to.trim() && subject.trim() && body.trim()) {
      onSend?.({ to, subject, body })
      setTo('')
      setSubject('')
      setBody('')
      onClose()
    }
  }

  if (!isOpen) return null

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg border border-border shadow-lg">
        <button
          onClick={() => setIsMinimized(false)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition rounded-t-lg"
        >
          <span className="text-sm font-medium">Compose</span>
          <span className="text-xs text-muted-foreground">minimized</span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg border border-border shadow-xl flex flex-col max-h-96 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-gray-50">
        <h3 className="font-semibold text-foreground">New Message</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-muted-foreground hover:text-foreground transition text-sm"
          >
            −
          </button>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <XIcon size={18} />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-3">
        {/* To */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">To</label>
          <Input
            type="email"
            placeholder="recipient@example.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full text-sm"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Subject</label>
          <Input
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full text-sm"
          />
        </div>

        {/* Body */}
        <div className="flex-1 min-h-24">
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Message</label>
          <textarea
            placeholder="Write your message here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-24 p-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border bg-gray-50 flex items-center justify-between">
        <div className="flex gap-2">
          <button className="text-muted-foreground hover:text-foreground transition p-1.5">
            <PaperclipIcon size={16} />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition p-1.5">
            <PaletteIcon size={16} />
          </button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!to.trim() || !subject.trim() || !body.trim()}
            className="gap-2 bg-primary text-primary-foreground hover:bg-blue-600 disabled:opacity-50"
            size="sm"
          >
            <SendIcon size={16} />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
