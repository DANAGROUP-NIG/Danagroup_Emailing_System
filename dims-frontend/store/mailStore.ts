// TODO: Implement Mail UI Store (Zustand)
// Ref: frontend-blueprint.md §4.2

import { create } from "zustand";
import type { ComposeData } from "@/types/mail.types";

interface MailState {
  selectedThreadId: string | null;
  isComposeOpen: boolean;
  composeDefaults: Partial<ComposeData> | null;
  setSelectedThread: (id: string | null) => void;
  openCompose: (defaults?: Partial<ComposeData>) => void;
  closeCompose: () => void;
}

export const useMailStore = create<MailState>()((set) => ({
  selectedThreadId: null,
  isComposeOpen: false,
  composeDefaults: {},
  setSelectedThread: (id) => set({ selectedThreadId: id }),
  openCompose: (defaults = {}) => set({ isComposeOpen: true, composeDefaults: defaults }),
  closeCompose: () => set({ isComposeOpen: false, composeDefaults: {} }),
}));
