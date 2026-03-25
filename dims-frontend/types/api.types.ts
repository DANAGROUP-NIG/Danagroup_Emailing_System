export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
