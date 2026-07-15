"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { departmentsApi } from "@/lib/api/departments";

const DEFAULT_LOGO = "/dana-logo.png";
const DEFAULT_FAVICON = "/favicon.ico";

export interface Branding {
  name: string;
  logoUrl: string;
  faviconUrl: string;
}

/**
 * Returns the branding for the current tenant.
 * - Authenticated users: derived from their subsidiary record.
 * - Public pages (login): fetched from /api/branding by hostname.
 */
export function useBranding() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const publicBranding = useQuery<Branding>({
    queryKey: ["branding", "public"],
    queryFn: async () => {
      const res = await departmentsApi.getBranding();
      const data = res.data ?? {};
      return {
        name: data?.name ?? "DIMS",
        logoUrl: data?.logoUrl || DEFAULT_LOGO,
        faviconUrl: data?.faviconUrl || DEFAULT_FAVICON,
      };
    },
    // Only fetch public branding when not authenticated; auth pages use this path.
    enabled: !isAuthenticated && typeof window !== "undefined",
    staleTime: 5 * 60 * 1000,
  });

  const branding = useMemo<Branding>(() => {
    if (user?.subsidiary) {
      return {
        name: user.subsidiary.name,
        logoUrl: user.subsidiary.logoUrl || DEFAULT_LOGO,
        faviconUrl: user.subsidiary.faviconUrl || DEFAULT_FAVICON,
      };
    }
    if (publicBranding.data) return publicBranding.data;
    return {
      name: "DIMS",
      logoUrl: DEFAULT_LOGO,
      faviconUrl: DEFAULT_FAVICON,
    };
  }, [user, publicBranding.data]);

  // Apply favicon dynamically on the client.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const link: HTMLLinkElement | null =
      document.querySelector("link[rel~='icon']") ||
      document.querySelector("link[rel='shortcut icon']");
    if (link && branding.faviconUrl) {
      link.href = branding.faviconUrl;
    }
  }, [branding.faviconUrl]);

  return {
    ...branding,
    isLoading: publicBranding.isLoading,
  };
}
