'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useEmailStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ComposeModal } from './compose-modal'
import {
  InboxIcon,
  SendIcon,
  FileTextIcon,
  StarIcon,
  AlertCircleIcon,
  PlusIcon,
  LogOutIcon,
} from 'lucide-react'

export function MailSidebar() {
  const store = useEmailStore()
  const [showLabelForm, setShowLabelForm] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [showCompose, setShowCompose] = useState(false)

  const unreadCount = store.emails.filter((e) => !e.isRead).length
  const spamCount = store.emails.filter((e) => e.isSpam).length

  const handleAddLabel = () => {
    if (newLabelName.trim()) {
      store.addLabel({
        id: Date.now().toString(),
        name: newLabelName,
        color: '#2563eb',
      })
      setNewLabelName('')
      setShowLabelForm(false)
    }
  }

  return (
    <div className="w-64 bg-sidebar border-r border-border h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary">Gmail</h1>
      </div>

      {/* Compose Button */}
      <div className="p-4">
        <Button 
          onClick={() => setShowCompose(true)}
          className="w-full rounded-full bg-primary hover:bg-blue-600 text-primary-foreground gap-2"
        >
          <PlusIcon size={18} />
          Compose
        </Button>
      </div>

      {/* Compose Modal */}
      <ComposeModal 
        isOpen={showCompose} 
        onClose={() => setShowCompose(false)}
      />

      {/* Folders */}
      <div className="flex-1 overflow-y-auto px-2">
        <nav className="space-y-2">
          <Link href="/dashboard">
            <button
              onClick={() => store.setActiveFolder('inbox')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition ${
                store.activeFolder === 'inbox'
                  ? 'bg-blue-100 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <InboxIcon size={18} />
              <span>Inbox</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {unreadCount}
                </Badge>
              )}
            </button>
          </Link>

          <Link href="/dashboard">
            <button
              onClick={() => store.setActiveFolder('starred')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition ${
                store.activeFolder === 'starred'
                  ? 'bg-blue-100 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <StarIcon size={18} />
              <span>Starred</span>
            </button>
          </Link>

          <Link href="/dashboard">
            <button
              onClick={() => store.setActiveFolder('sent')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition ${
                store.activeFolder === 'sent'
                  ? 'bg-blue-100 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <SendIcon size={18} />
              <span>Sent</span>
            </button>
          </Link>

          <Link href="/dashboard">
            <button
              onClick={() => store.setActiveFolder('drafts')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition ${
                store.activeFolder === 'drafts'
                  ? 'bg-blue-100 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <FileTextIcon size={18} />
              <span>Drafts</span>
            </button>
          </Link>

          <Link href="/dashboard">
            <button
              onClick={() => store.setActiveFolder('spam')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition ${
                store.activeFolder === 'spam'
                  ? 'bg-blue-100 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <AlertCircleIcon size={18} />
              <span>Spam</span>
              {spamCount > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs">
                  {spamCount}
                </Badge>
              )}
            </button>
          </Link>
        </nav>

        {/* Labels Section */}
        <div className="mt-6 border-t border-border pt-4">
          <div className="flex items-center justify-between px-4 mb-3">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Labels</h3>
            <button
              onClick={() => setShowLabelForm(!showLabelForm)}
              className="text-primary hover:text-blue-600"
            >
              <PlusIcon size={16} />
            </button>
          </div>

          {showLabelForm && (
            <div className="px-4 mb-3 flex gap-2">
              <Input
                size="sm"
                placeholder="Label name"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleAddLabel}
                className="bg-primary text-primary-foreground hover:bg-blue-600"
              >
                Add
              </Button>
            </div>
          )}

          <div className="space-y-1">
            {store.labels.map((label) => (
              <Link key={label.id} href="/dashboard">
                <button
                  onClick={() => store.setActiveLabel(label.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition ${
                    store.activeLabel === label.id
                      ? 'bg-blue-100 text-primary'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  <span>{label.name}</span>
                  {label.count && (
                    <span className="ml-auto text-xs text-muted-foreground">{label.count}</span>
                  )}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* User section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
            {store.currentUser?.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{store.currentUser?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{store.currentUser?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
          <LogOutIcon size={16} />
          Sign out
        </Button>
      </div>
    </div>
  )
}
