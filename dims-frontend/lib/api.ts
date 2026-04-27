import axios, { AxiosProgressEvent, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

function resolveApiUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredUrl && /^https?:\/\//i.test(configuredUrl)) {
    return configuredUrl;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const localBackendBase = `${protocol}//${hostname}:3001`;

    if (configuredUrl?.startsWith("/")) {
      return `${localBackendBase}${configuredUrl}`;
    }

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${localBackendBase}/api`;
    }
  }

  return configuredUrl || "http://localhost:3001/api";
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
      return `${protocol}//${host}:3001`;
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

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().user?.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const isLoginRequest = originalRequest?.url?.includes("/auth/login");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isLoginRequest
    ) {
      originalRequest._retry = true;

      try {
        const state = useAuthStore.getState();
        const refreshToken = state.user?.refreshToken;

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true },
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        const currentUser = state.user;

        if (currentUser) {
          state.setUser({
            ...currentUser,
            accessToken,
            refreshToken: newRefreshToken,
          });
        }

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
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

export default api;
