// TODO: Implement Axios API instance
// - Base URL: process.env.NEXT_PUBLIC_API_URL
// - withCredentials: true (for httpOnly cookie auth)
// - Request interceptor: attach access token from cookie if available
// - Response interceptor:
//   - On 401: attempt token refresh via POST /api/auth/refresh
//   - If refresh succeeds: retry original request
//   - If refresh fails: redirect to /login
// - Typed API methods grouped by domain:
//   authApi, mailApi, usersApi, filesApi, announcementsApi, searchApi

import { useAuthStore } from "@/store/authStore";
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// TODO: Add request interceptor: Attach current Access Token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().user?.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
// TODO: Add response interceptor with refresh token logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and it's NOT a login request
    const isLoginRequest = originalRequest.url.includes('/auth/login');

    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      originalRequest._retry = true;  //Mark as retried to avoid infinite loops

      try {
        const { user, setUser }  = useAuthStore.getState();

        if (!user?.refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call your refresh endpoint using base axios
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refreshToken: user.refreshToken
        });

        const {accessToken, refreshToken: newRefreshToken} = response.data.data;

        // Update the store with new tokens while keeping existing user data
        if (user) {
          setUser({...user, accessToken, refreshToken:newRefreshToken});
        }

        //Update the original request's header and retry
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // If refresh fails (token expired/invalid), log out the user
        useAuthStore.getState().clearUser();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
