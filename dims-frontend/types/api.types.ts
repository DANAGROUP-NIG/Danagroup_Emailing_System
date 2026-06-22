/** Canonical envelope returned by ApiResponseDto<T> on the backend. */
export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Paginated response returned by mail folder endpoints.
 * Shape: { data, total, page, lastPage }
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
}

/**
 * Paginated response returned by non-mail endpoints (users, notifications,
 * announcements) that return `limit` instead of `lastPage`.
 * Compute lastPage client-side: Math.ceil(total / limit)
 */
export interface BackendPageResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: "new_mail" | "announcement" | "system";
  title: string;
  body?: string;
  isRead: boolean;
  referenceId?: string;
  createdAt: string;
}

export interface SearchResult {
  type: "mail" | "user";
  id: string;
  title: string;
  subtitle: string;
  url: string;
}
