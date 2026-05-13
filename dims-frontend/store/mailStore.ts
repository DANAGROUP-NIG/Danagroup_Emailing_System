// TODO: Implement Mail UI Store (Zustand)
// Ref: frontend-blueprint.md §4.2

import { create } from 'zustand';

import type { Attachment } from "@/types/mail.types";

type MailFolder = "inbox" | "sent" | "drafts" | "starred" | "trash";

export type ComposeMode = "new" | "draft" | "reply" | "forward";

export type ComposeDefaults = {
  mode?: ComposeMode;
  draftId?: string | null;
  threadId?: string | null;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  bodyHtml?: string | null;
  attachments?: Attachment[];
};

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
  openCompose: (draftId?: string | null, defaults?: ComposeDefaults) => void;
  openReply: (defaults: ComposeDefaults) => void;
  openForward: (defaults: ComposeDefaults) => void;
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
  openCompose: (draftId?: string | null, defaults?: ComposeDefaults) => set({ 
    isComposeOpen: true, 
    composeDraftId: draftId || defaults?.draftId || null,
    composeDefaults: defaults ?? null,
  }),

  openReply: (defaults) => set({
    isComposeOpen: true,
    composeDraftId: defaults.draftId || null,
    composeDefaults: {
      ...defaults,
      mode: defaults.mode ?? "reply",
    },
  }),

  openForward: (defaults) => set({
    isComposeOpen: true,
    composeDraftId: defaults.draftId || null,
    composeDefaults: {
      ...defaults,
      mode: "forward",
      threadId: null,
      to: defaults.to ?? "",
      cc: defaults.cc ?? "",
      bcc: defaults.bcc ?? "",
    },
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
