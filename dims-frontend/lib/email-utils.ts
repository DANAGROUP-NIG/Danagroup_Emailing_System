import { Email } from '@/types'
import { formatDistanceToNow, format } from 'date-fns'

export function formatEmailTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = diff / (1000 * 60 * 60 * 24)

  if (days < 1) {
    return formatDistanceToNow(date, { addSuffix: false })
  } else if (days < 7) {
    return format(date, 'EEE')
  } else {
    return format(date, 'MMM d')
  }
}

export function getAvatarColor(email: string): string {
  const colors = [
    'bg-blue-500',
    'bg-red-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-cyan-500',
  ]
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function truncateText(text: string, maxLength: number = 50): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

export function searchEmails(emails: Email[], query: string): Email[] {
  if (!query.trim()) return emails

  const lowerQuery = query.toLowerCase()
  return emails.filter(
    (email) =>
      email.subject.toLowerCase().includes(lowerQuery) ||
      email.body.toLowerCase().includes(lowerQuery) ||
      email.from.fullName.toLowerCase().includes(lowerQuery) ||
      email.from.email.toLowerCase().includes(lowerQuery)
  )
}

export function filterEmailsByFolder(
  emails: Email[],
  folder: 'inbox' | 'sent' | 'drafts' | 'starred' | 'spam' | 'custom'
): Email[] {
  switch (folder) {
    case 'starred':
      return emails.filter((e) => e.isStarred)
    case 'spam':
      return emails.filter((e) => e.isSpam)
    case 'sent':
      return emails.filter((e) => e.from.id === '1') // current user
    case 'drafts':
      return [] // no drafts in mock data
    case 'inbox':
    default:
      return emails.filter((e) => !e.isSpam)
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
