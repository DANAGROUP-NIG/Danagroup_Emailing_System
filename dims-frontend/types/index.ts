export interface User {
  id: string
  email: string
  fullName: string
  avatar?: string
}

export interface Email {
  id: string
  threadId: string
  from: User
  to: User
  subject: string
  body: string
  timestamp: Date
  isRead: boolean
  isStarred: boolean
  isSpam: boolean
  labels: string[]
  attachments: Attachment[]
}

export interface Thread {
  id: string
  userId: string
  subject: string
  participants: User[]
  emails: Email[]
  lastMessageAt: Date
  isStarred: boolean
  labels: string[]
}

export interface Label {
  id: string
  name: string
  color: string
  count?: number
}

export interface Attachment {
  id: string
  filename: string
  size: number
  mimeType: string
  url: string
}

export type Folder = 'inbox' | 'sent' | 'drafts' | 'starred' | 'spam' | 'custom'

export interface EmailStore {
  emails: Email[]
  threads: Thread[]
  labels: Label[]
  currentUser: User | null
  selectedThreadId: string | null
  searchQuery: string
  activeFolder: Folder
  activeLabel: string | null
}
