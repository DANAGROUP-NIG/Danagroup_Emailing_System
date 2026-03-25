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

import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// TODO: Add request interceptor
// TODO: Add response interceptor with refresh token logic

export default api;
