import apiClient from "./client";
import { ParticipantSummary } from "@/types/mail.types";

export const contactsApi = {
  search: (query: string, limit: number = 10, signal?: AbortSignal) =>
    apiClient.get<{ data: ParticipantSummary[] }>("/contacts/search", {
      params: { q: query, limit },
      ...(signal ? { signal } : {}),
    }),

  importCsv: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ imported: number }>("/contacts/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
