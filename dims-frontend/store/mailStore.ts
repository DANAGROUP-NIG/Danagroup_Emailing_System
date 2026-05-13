// TODO: Implement Mail UI Store (Zustand)
// Ref: frontend-blueprint.md §4.2

import { create } from 'zustand';

type MailFolder = "inbox" | "sent" | "drafts" | "trash";

interface MailStore {
  // Navigation & View State
  activeFolder: MailFolder;
  selectedThreadId: string | null;
  
  // Selection State (for Bulk Actions)
  selectedMessageIds: string[];
  
  // Compose Modal State
  isComposeOpen: boolean;
  composeDraftId: string | null; // If editing an existing draft

  // Actions
  setFolder: (folder: MailFolder) => void;
  setSelectedThread: (id: string | null) => void;
  
  // Multi-select Actions
  toggleMessageSelection: (id: string) => void;
  resetSelection: () => void;
  
  // Compose Actions
  openCompose: (draftId?: string) => void;
  setComposeDraftId: (draftId: string | null) => void;
  closeCompose: () => void;
}

export const useMailStore = create<MailStore>((set) => ({
  activeFolder: "inbox",
  selectedThreadId: null,
  selectedMessageIds: [],
  isComposeOpen: false,
  composeDraftId: null,

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
  openCompose: (draftId?: string | null) => set({ 
    isComposeOpen: true, 
    composeDraftId: draftId || null
  }),

  setComposeDraftId: (draftId) => set({
    composeDraftId: draftId,
  }),
  
  closeCompose: () => set({ 
    isComposeOpen: false, 
    composeDraftId: null 
  }),
}));
