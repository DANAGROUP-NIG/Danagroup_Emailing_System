"use client";

import { useQuery } from "@tanstack/react-query";
import { searchApi } from "@/lib/api/search";
import type { SearchResult } from "@/types/api.types";

const SEARCH_STALE_TIME = 15_000;
const MIN_QUERY_LENGTH = 2;

export function useSearchMail(query: string) {
  return useQuery<SearchResult[]>({
    queryKey: ["search", "mail", query],
    queryFn: async () => {
      const res = await searchApi.search({ q: query, type: "mail" });
      return res.data.data?.results ?? [];
    },
    enabled: query.length >= MIN_QUERY_LENGTH,
    staleTime: SEARCH_STALE_TIME,
  });
}

export function useSearchUsers(query: string) {
  return useQuery<SearchResult[]>({
    queryKey: ["search", "users", query],
    queryFn: async () => {
      const res = await searchApi.search({ q: query, type: "users" });
      return res.data.data?.results ?? [];
    },
    enabled: query.length >= MIN_QUERY_LENGTH,
    staleTime: SEARCH_STALE_TIME,
  });
}

export function useSearch(query: string) {
  return useQuery<SearchResult[]>({
    queryKey: ["search", "all", query],
    queryFn: async () => {
      const res = await searchApi.search({ q: query, type: "all" });
      return res.data.data?.results ?? [];
    },
    enabled: query.length >= MIN_QUERY_LENGTH,
    staleTime: SEARCH_STALE_TIME,
  });
}
