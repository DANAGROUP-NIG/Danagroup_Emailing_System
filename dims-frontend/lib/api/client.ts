import axios, { type InternalAxiosRequestConfig } from "axios";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

// Singleton in-flight refresh promise to prevent race conditions
let refreshPromise: Promise<void> | null = null;

export function resolveApiUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredUrl && /^https?:\/\//i.test(configuredUrl)) {
    // Strip trailing slash to avoid double-slash issues
    return configuredUrl.replace(/\/+$/, "");
  }

  if (configuredUrl?.startsWith("/")) {
    return configuredUrl.replace(/\/+$/, "");
  }

  // Fallback — direct to backend default
  return "http://localhost:8000/api";
}

export function resolveSocketUrl(): string | undefined {
  const configuredUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();

  if (configuredUrl && /^(wss?:)?\/\//i.test(configuredUrl)) {
    return configuredUrl;
  }

  return undefined;
}

export const API_URL = resolveApiUrl();
export const SOCKET_URL = resolveSocketUrl();

export function getSocketBaseUrl(): string {
  if (SOCKET_URL) {
    return SOCKET_URL.replace(/\/$/, "");
  }

  return API_URL.replace(/\/api\/?$/, "");
}

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest", // CSRF protection header
  },
});

apiClient.interceptors.response.use(
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
        // Use singleton pattern to prevent multiple simultaneous refresh attempts
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
            .then(() => {
              refreshPromise = null;
            })
            .catch((refreshError) => {
              refreshPromise = null;
              throw refreshError;
            });
        }

        await refreshPromise;
        return apiClient(originalRequest);
      } catch (refreshError) {
        const { useAuthStore } = await import("@/store/authStore");
        useAuthStore.getState().clearUser();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
