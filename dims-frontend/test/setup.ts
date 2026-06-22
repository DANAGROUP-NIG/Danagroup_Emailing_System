import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll, vi } from "vitest";
import { server } from "./mocks/server";

// Set required env vars before any module that reads them is loaded
process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:8000/api";
process.env.NEXT_PUBLIC_WS_URL ??= "ws://localhost:8000";
process.env.NEXT_PUBLIC_APP_NAME ??= "DIMS Test";

// Mock next/navigation so useRouter() works outside the Next.js App Router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
}));

// Mock Radix UI Avatar — jsdom does not fire img load/error events so the
// Fallback never becomes visible without this mock.
vi.mock("@radix-ui/react-avatar", async () => {
  const React = await import("react");
  return {
    Root: ({
      children,
      className,
    }: {
      children?: React.ReactNode;
      className?: string;
    }) => React.createElement("span", { className }, children),
    Image: ({
      src,
      alt,
      className,
    }: {
      src?: string;
      alt?: string;
      className?: string;
    }) =>
      src
        ? React.createElement("img", { src, alt, className })
        : null,
    Fallback: ({
      children,
      className,
    }: {
      children?: React.ReactNode;
      className?: string;
      delayMs?: number;
    }) => React.createElement("span", { className }, children),
  };
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: vi.fn(),
});

// Mock fetch for Next.js
global.fetch = vi.fn();

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

// Reset any request handlers that we may add during the tests
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Clean up after the tests are finished
afterAll(() => {
  server.close();
});
