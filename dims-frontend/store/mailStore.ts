import { create } from 'zustand';

import type { MailFolder } from "@/types/mail.types";

export type ComposeMode = "new" | "reply" | "forward";

export interface ComposeRecipient {
  id: string;
  name: string;
  email: string;
}

export interface ComposeDefaults {
  mode?: ComposeMode;
  threadId?: string;
  to?: string | ComposeRecipient[];
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
}

interface MailStore {
  // Navigation & View State
  activeFolder: MailFolder;
  selectedThreadId: string | null;
  
  // Selection State (for Bulk Actions)
  selectedMessageIds: string[];
  
  // Compose Modal State
  isComposeOpen: boolean;
  composeDraftId: string | null; // If editing an existing draft
  composeDefaults: ComposeDefaults | null;

  // Actions
  setFolder: (folder: MailFolder) => void;
  setSelectedThread: (id: string | null) => void;
  
  // Multi-select Actions
  toggleMessageSelection: (id: string) => void;
  resetSelection: () => void;
  
  // Compose Actions
  openCompose: (draftId?: string | null, defaults?: ComposeDefaults | null) => void;
  setComposeDraftId: (draftId: string | null) => void;
  closeCompose: () => void;
}

export const useMailStore = create<MailStore>((set) => ({
  activeFolder: "inbox",
  selectedThreadId: null,
  selectedMessageIds: [],
  isComposeOpen: false,
  composeDraftId: null,
  composeDefaults: null,

  // Change folder and reset dependent states
  setFolder: (folder) => set({ 
    activeFolder: folder, 
    selectedThreadId: null, 
    selectedMessageIds: [] 
  }),

  setSelectedThread: (id) => set({ 
    selectedThreadId: id 
  }),

  // Selection logic for bulk "Mark as Read" or "Delete"
  toggleMessageSelection: (id) => set((state) => ({
    selectedMessageIds: state.selectedMessageIds.includes(id)
      ? state.selectedMessageIds.filter((mId) => mId !== id)
      : [...state.selectedMessageIds, id],
  })),

  resetSelection: () => set({ selectedMessageIds: [] }),

  // Compose management
  openCompose: (draftId?: string | null, defaults?: ComposeDefaults | null) => set({ 
    isComposeOpen: true, 
    composeDraftId: draftId || null,
    composeDefaults: defaults || null,
  }),

  setComposeDraftId: (draftId) => set({
    composeDraftId: draftId,
  }),
  
  closeCompose: () => set({ 
    isComposeOpen: false, 
    composeDraftId: null,
    composeDefaults: null,
  }),
}));
