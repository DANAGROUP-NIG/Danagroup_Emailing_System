import { describe, it, expect, vi, beforeEach } from "vitest";
import { authApi } from "./auth";
import apiClient from "./client";

// Mock the client module
vi.mock("./client", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("authApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should call post with correct endpoint and payload", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Login successful",
          data: {
            user: {
              id: "user-1",
              email: "test@dana.com",
              firstName: "Test",
              lastName: "User",
              role: "employee",
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const payload = { email: "test@dana.com", password: "password123" };
      const result = await authApi.login(payload);

      expect(apiClient.post).toHaveBeenCalledWith("/auth/login", payload);
      expect(result).toEqual(mockResponse);
    });

    it("should handle login error", async () => {
      const mockError = new Error("Invalid credentials");
      vi.mocked(apiClient.post).mockRejectedValue(mockError);

      const payload = { email: "test@dana.com", password: "wrong" };

      await expect(authApi.login(payload)).rejects.toThrow("Invalid credentials");
    });
  });

  describe("logout", () => {
    it("should call post with correct endpoint", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Logout successful",
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authApi.logout();

      expect(apiClient.post).toHaveBeenCalledWith("/auth/logout");
      expect(result).toEqual(mockResponse);
    });
  });

  describe("refresh", () => {
    it("should call post with correct endpoint and empty body", async () => {
      const mockResponse = {
        data: {
          success: true,
          message: "Token refreshed",
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authApi.refresh();

      expect(apiClient.post).toHaveBeenCalledWith("/auth/refresh", {});
      expect(result).toEqual(mockResponse);
    });
  });

  describe("me", () => {
    it("should call get with correct endpoint", async () => {
      const mockUser = {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        email: "john@dana.com",
        role: "employee",
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      const mockResponse = {
        data: {
          success: true,
          message: "User fetched",
          data: mockUser,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await authApi.me();

      expect(apiClient.get).toHaveBeenCalledWith("/auth/me");
      expect(result).toEqual(mockResponse);
    });
  });
});
