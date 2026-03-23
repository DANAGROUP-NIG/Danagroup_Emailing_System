import { create } from 'zustand'
import { Email } from '@/lib/types/email'
import { SAMPLE_EMAILS } from '@/lib/data/sample-emails'

interface MailStore {
  emails: Email[]
  addEmail: (email: Email) => void
  deleteEmail: (id: string) => void
  updateEmail: (id: string, email: Partial<Email>) => void
  toggleStar: (id: string) => void
}

export const useMailStore = create<MailStore>((set) => ({
  emails: SAMPLE_EMAILS,

  addEmail: (email: Email) =>
    set((state) => ({
      emails: [email, ...state.emails],
    })),

  deleteEmail: (id: string) =>
    set((state) => ({
      emails: state.emails.filter((email) => email.id !== id),
    })),

  updateEmail: (id: string, updates: Partial<Email>) =>
    set((state) => ({
      emails: state.emails.map((email) =>
        email.id === id ? { ...email, ...updates } : email
      ),
    })),

  toggleStar: (id: string) =>
    set((state) => ({
      emails: state.emails.map((email) =>
        email.id === id ? { ...email, starred: !email.starred } : email
      ),
    })),
}))
