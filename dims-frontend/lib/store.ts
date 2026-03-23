import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Email, Thread, Label, Folder, EmailStore } from '@/types'
import { mockEmails, mockThreads, mockLabels, mockCurrentUser } from './mock-data'

interface AppStore extends EmailStore {
  setCurrentUser: (user: any) => void
  setSelectedThread: (threadId: string | null) => void
  setSearchQuery: (query: string) => void
  setActiveFolder: (folder: Folder) => void
  setActiveLabel: (labelId: string | null) => void
  toggleEmailStar: (emailId: string) => void
  toggleEmailRead: (emailId: string) => void
  deleteEmail: (emailId: string) => void
  addLabel: (label: Label) => void
  addEmailToLabel: (emailId: string, labelId: string) => void
  removeEmailFromLabel: (emailId: string, labelId: string) => void
  archiveEmail: (emailId: string) => void
  markAsSpam: (emailId: string) => void
}

export const useEmailStore = create<AppStore>()(
  persist(
    (set) => ({
      emails: mockEmails,
      threads: mockThreads,
      labels: mockLabels,
      currentUser: mockCurrentUser,
      selectedThreadId: null,
      searchQuery: '',
      activeFolder: 'inbox',
      activeLabel: null,

      setCurrentUser: (user) => set({ currentUser: user }),

      setSelectedThread: (threadId) => set({ selectedThreadId: threadId }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setActiveFolder: (folder) => set({ activeFolder: folder, activeLabel: null }),

      setActiveLabel: (labelId) => set({ activeLabel: labelId, activeFolder: 'custom' }),

      toggleEmailStar: (emailId) =>
        set((state) => ({
          emails: state.emails.map((email) =>
            email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
          ),
        })),

      toggleEmailRead: (emailId) =>
        set((state) => ({
          emails: state.emails.map((email) =>
            email.id === emailId ? { ...email, isRead: !email.isRead } : email
          ),
        })),

      deleteEmail: (emailId) =>
        set((state) => ({
          emails: state.emails.filter((email) => email.id !== emailId),
        })),

      addLabel: (label) =>
        set((state) => ({
          labels: [...state.labels, label],
        })),

      addEmailToLabel: (emailId, labelId) =>
        set((state) => ({
          emails: state.emails.map((email) =>
            email.id === emailId && !email.labels.includes(labelId)
              ? { ...email, labels: [...email.labels, labelId] }
              : email
          ),
        })),

      removeEmailFromLabel: (emailId, labelId) =>
        set((state) => ({
          emails: state.emails.map((email) =>
            email.id === emailId
              ? { ...email, labels: email.labels.filter((id) => id !== labelId) }
              : email
          ),
        })),

      archiveEmail: (emailId) =>
        set((state) => ({
          emails: state.emails.filter((email) => email.id !== emailId),
        })),

      markAsSpam: (emailId) =>
        set((state) => ({
          emails: state.emails.map((email) =>
            email.id === emailId ? { ...email, isSpam: true } : email
          ),
        })),
    }),
    {
      name: 'email-store',
    }
  )
)
