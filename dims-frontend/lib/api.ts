import axios, { AxiosProgressEvent, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

function resolveApiUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  // Absolute URL — use directly
  if (configuredUrl && /^https?:\/\//i.test(configuredUrl)) {
    return configuredUrl;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:8000/api`;
    }
  }

  // Relative path (e.g. /api) — return as-is so the current origin (nginx/tunnel) handles routing
  if (configuredUrl?.startsWith("/")) {
    return configuredUrl;
  }

  // No env var — fall back to direct localhost:8000 for bare local dev without a proxy
  return "http://localhost:8000/api";
}

function resolveSocketUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();

  if (configuredUrl && /^(wss?:)?\/\//i.test(configuredUrl)) {
    return configuredUrl;
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;

    if (host === "localhost" || host === "127.0.0.1") {
      return `${protocol}//${host}:8000`;
    }
  }

  return undefined;
}

const API_URL = resolveApiUrl();
const SOCKET_URL = resolveSocketUrl();

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const isLoginRequest = originalRequest?.url?.includes("/auth/login");
    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isLoginRequest &&
      !isRefreshRequest
    ) {
      originalRequest._retry = true;

      try {
        await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearUser();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export function getSocketBaseUrl() {
  if (SOCKET_URL) {
    return SOCKET_URL.replace(/\/$/, "");
  }

  return API_URL?.replace(/\/api\/?$/, "");
}

export const filesApi = {
  async uploadAttachment(
    file: File,
    onUploadProgress?: (progress: number) => void,
  ) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (!event.total || !onUploadProgress) {
          return;
        }

        const progress = Math.round((event.loaded / event.total) * 100);
        onUploadProgress(progress);
      },
    });

    return response.data.data;
  },

  async deleteAttachment(id: string) {
    const response = await api.delete(`/files/${id}`);
    return response.data.data;
  },

  async getDownloadUrl(id: string) {
    const response = await api.get(`/files/${id}/download`);
    return response.data.data;
  },
};

export const authApi = {
  requestPasswordReset: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (payload: { token: string; password: string }) =>
    api.post("/auth/reset-password", payload),
};

export const mailApi = {
  getThreads: (folder: string, limit: number = 50, offset: number = 0) =>
    api.get(`/mail/threads?folder=${folder}&limit=${limit}&offset=${offset}`),
  getThread: (threadId: string) =>
    api.get(`/mail/threads/${threadId}`),
  getMessages: (threadId: string) =>
    api.get(`/mail/threads/${threadId}/messages`),
  searchMessages: (query: string) =>
    api.get(`/mail/search?query=${encodeURIComponent(query)}`),
  sendMessage: (payload: any) =>
    api.post("/mail/messages/send", payload),
  saveDraft: (threadId: string, payload: any) =>
    api.post(`/mail/threads/${threadId}/drafts`, payload),
  updateDraft: (draftId: string, payload: any) =>
    api.patch(`/mail/drafts/${draftId}`, payload),
  deleteMessage: (messageId: string) =>
    api.delete(`/mail/messages/${messageId}`),
  archiveThread: (threadId: string) =>
    api.patch(`/mail/threads/${threadId}/archive`, { archived: true }),
  starThread: (threadId: string, starred: boolean) =>
    api.patch(`/mail/threads/${threadId}`, { starred }),
  markAsRead: (threadId: string, isRead: boolean) =>
    api.patch(`/mail/threads/${threadId}`, { isRead }),
  getRecipientSuggestions: (query: string) =>
    api.get(`/directory/search?query=${encodeURIComponent(query)}&type=user`),
};

export default api;
