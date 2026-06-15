"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { ToastProvider } from "@/components/ui/Toast";

if (process.env.NODE_ENV !== "production") {
  // Dynamic import so axe-core is never bundled into production builds
  import("@axe-core/react").then(({ default: axe }) => {
    import("react").then((React) => {
      import("react-dom").then((ReactDOM) => {
        axe(React, ReactDOM, 1000);
      });
    });
  });
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient is created once per session to ensure stable cache
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: "always",
          },
          mutations: { retry: 0 },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
