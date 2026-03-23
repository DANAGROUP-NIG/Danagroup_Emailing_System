'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  InboxIcon,
  StarIcon,
  SendIcon,
  FileTextIcon,
  MailIcon,
  TrashIcon,
  Plus,
} from 'lucide-react'
import { useMailStore } from '@/lib/store/mail-store'

interface MailSidebarProps {
  currentFolder: string
  onFolderChange: (folder: string) => void
  onCompose: () => void
}

export function MailSidebar({
  currentFolder,
  onFolderChange,
  onCompose,
}: MailSidebarProps) {
  const { emails } = useMailStore()

  const inboxCount = emails.filter((e) => e.folder === 'inbox').length
  const starredCount = emails.filter((e) => e.starred).length
  const sentCount = emails.filter((e) => e.folder === 'sent').length
  const draftsCount = emails.filter((e) => e.folder === 'drafts').length

  const folders = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: InboxIcon,
      count: inboxCount,
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: StarIcon,
      count: starredCount,
    },
    {
      id: 'sent',
      label: 'Sent',
      icon: SendIcon,
      count: sentCount,
    },
    {
      id: 'drafts',
      label: 'Drafts',
      icon: FileTextIcon,
      count: draftsCount,
    },
  ]

  const labels = [
    { id: 'important', label: 'Important', color: 'text-red-500' },
    { id: 'work', label: 'Work', color: 'text-blue-500' },
    { id: 'personal', label: 'Personal', color: 'text-green-500' },
  ]

  return (
    <div className="w-64 border-r flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-primary rounded-lg">
            <MailIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Gmail
          </span>
        </div>
        <Button
          onClick={onCompose}
          className="w-full rounded-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-white shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          Compose
        </Button>
      </div>

      <Separator />

      {/* Folders */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-4 space-y-2">
          {folders.map((folder) => {
            const Icon = folder.icon
            return (
              <button
                key={folder.id}
                onClick={() => onFolderChange(folder.id)}
                className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  currentFolder === folder.id
                    ? 'bg-primary/15 text-primary font-medium shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/60'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1 text-left text-sm">{folder.label}</span>
                {folder.count > 0 && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    currentFolder === folder.id
                      ? 'bg-primary/30 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {folder.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <Separator className="my-2" />

        {/* Labels */}
        <div className="px-2 py-4">
          <div className="flex items-center justify-between mb-3 px-4">
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Labels
            </span>
            <button className="text-muted-foreground hover:text-primary hover:bg-muted rounded p-1 transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1.5">
            {labels.map((label) => (
              <button
                key={label.id}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm hover:bg-muted/70 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${label.color}`} />
                <span>{label.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator className="my-2" />

        {/* More */}
        <div className="px-2 py-4">
          <button className="w-full flex items-center gap-4 px-4 py-2 rounded-lg text-muted-foreground text-sm hover:bg-muted transition-colors">
            <TrashIcon className="w-5 h-5" />
            Trash
          </button>
        </div>
      </ScrollArea>
    </div>
  )
}
