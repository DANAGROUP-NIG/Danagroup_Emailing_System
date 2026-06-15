import apiClient from "./client";
import type { SearchResult } from "@/types/api.types";

export interface SearchParams {
  q: string;
  type?: "all" | "users" | "mail";
  page?: number;
  limit?: number;
  department?: string;
  subsidiary?: string;
  role?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
}

export const searchApi = {
  search: (params: SearchParams) =>
    apiClient.get<{ data: SearchResponse }>("/search", { params }),
};
