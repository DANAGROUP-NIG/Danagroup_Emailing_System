import apiClient from "./client";
import type { AxiosProgressEvent } from "axios";

export interface UploadedAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  messageId: string | null;
  createdAt: string;
}

export interface DownloadUrlData {
  id: string;
  url: string;
  expiresIn: number;
}

export const filesApi = {
  upload: (file: File, onUploadProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ data: UploadedAttachment }>("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (!event.total || !onUploadProgress) return;
        onUploadProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
  },

  getDownloadUrl: (id: string) =>
    apiClient.get<{ data: DownloadUrlData }>(`/files/${id}/download`),

  delete: (id: string) =>
    apiClient.delete<{ data: { id: string; deleted: boolean } }>(`/files/${id}`),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ data: { avatarUrl: string } }>("/files/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
