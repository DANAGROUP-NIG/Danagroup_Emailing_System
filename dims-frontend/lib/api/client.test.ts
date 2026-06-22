import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { API_URL, resolveApiUrl, resolveSocketUrl } from "./client";

describe("resolveApiUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return configured URL when valid http URL is provided", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.example.com/api";
    expect(resolveApiUrl()).toBe("http://api.example.com/api");
  });

  it("should return configured URL when valid https URL is provided", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com/api";
    expect(resolveApiUrl()).toBe("https://api.example.com/api");
  });

  it("should return configured URL when path-based URL is provided", () => {
    process.env.NEXT_PUBLIC_API_URL = "/api";
    expect(resolveApiUrl()).toBe("/api");
  });

  it("should return default URL when no API URL is configured", () => {
    expect(resolveApiUrl()).toBe("http://localhost:8000/api");
  });

  it("should return default URL when invalid URL is provided", () => {
    process.env.NEXT_PUBLIC_API_URL = "not-a-valid-url";
    expect(resolveApiUrl()).toBe("http://localhost:8000/api");
  });

  it("should trim whitespace from configured URL", () => {
    process.env.NEXT_PUBLIC_API_URL = "  http://api.example.com/api  ";
    expect(resolveApiUrl()).toBe("http://api.example.com/api");
  });
});

describe("resolveSocketUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_WS_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return configured URL when valid ws URL is provided", () => {
    process.env.NEXT_PUBLIC_WS_URL = "ws://socket.example.com";
    expect(resolveSocketUrl()).toBe("ws://socket.example.com");
  });

  it("should return configured URL when valid wss URL is provided", () => {
    process.env.NEXT_PUBLIC_WS_URL = "wss://socket.example.com";
    expect(resolveSocketUrl()).toBe("wss://socket.example.com");
  });

  it("should return configured URL when protocol-relative URL is provided", () => {
    process.env.NEXT_PUBLIC_WS_URL = "//socket.example.com";
    expect(resolveSocketUrl()).toBe("//socket.example.com");
  });

  it("should return undefined when no WS URL is configured", () => {
    expect(resolveSocketUrl()).toBeUndefined();
  });

  it("should return undefined when invalid URL is provided", () => {
    process.env.NEXT_PUBLIC_WS_URL = "http://example.com";
    expect(resolveSocketUrl()).toBeUndefined();
  });

  it("should trim whitespace from configured URL", () => {
    process.env.NEXT_PUBLIC_WS_URL = "  ws://socket.example.com  ";
    expect(resolveSocketUrl()).toBe("ws://socket.example.com");
  });
});

describe("API_URL constant", () => {
  it("should be defined", () => {
    expect(API_URL).toBeDefined();
    expect(typeof API_URL).toBe("string");
  });

  it("should be a valid URL or path", () => {
    expect(API_URL.startsWith("http") || API_URL.startsWith("/")).toBe(true);
  });
});

