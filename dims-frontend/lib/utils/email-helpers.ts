import { Email } from '@/lib/types/email'

/**
 * Format email address for display
 */
export function formatEmailAddress(email: string): string {
  return email.toLowerCase()
}

/**
 * Get user initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, length: number = 100): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Check if email is unread
 */
export function isUnread(email: Email): boolean {
  return !email.read
}

/**
 * Group emails by date
 */
export function groupEmailsByDate(emails: Email[]): Record<string, Email[]> {
  const grouped: Record<string, Email[]> = {}

  emails.forEach((email) => {
    const date = new Date(email.timestamp).toLocaleDateString()
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(email)
  })

  return grouped
}

/**
 * Filter emails by folder
 */
export function filterByFolder(emails: Email[], folder: string): Email[] {
  if (folder === 'starred') {
    return emails.filter((e) => e.starred)
  }
  return emails.filter((e) => e.folder === folder)
}

/**
 * Search emails
 */
export function searchEmails(emails: Email[], query: string): Email[] {
  const lowerQuery = query.toLowerCase()

  return emails.filter((email) => {
    return (
      email.subject.toLowerCase().includes(lowerQuery) ||
      email.preview.toLowerCase().includes(lowerQuery) ||
      email.sender.name.toLowerCase().includes(lowerQuery) ||
      email.sender.email.toLowerCase().includes(lowerQuery)
    )
  })
}

/**
 * Calculate email statistics
 */
export function calculateEmailStats(emails: Email[]) {
  return {
    total: emails.length,
    unread: emails.filter((e) => !e.read).length,
    starred: emails.filter((e) => e.starred).length,
    byFolder: {
      inbox: emails.filter((e) => e.folder === 'inbox').length,
      sent: emails.filter((e) => e.folder === 'sent').length,
      drafts: emails.filter((e) => e.folder === 'drafts').length,
      trash: emails.filter((e) => e.folder === 'trash').length,
    },
  }
}

/**
 * Sort emails by date (newest first)
 */
export function sortByDate(emails: Email[]): Email[] {
  return [...emails].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Get email preview text
 */
export function getEmailPreview(body: string, length: number = 100): string {
  return body
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, length)
    .concat(body.length > length ? '...' : '')
}

/**
 * Parse email recipients
 */
export function parseRecipients(text: string) {
  return text
    .split(',')
    .map((email) => email.trim())
    .filter((email) => isValidEmail(email))
}
