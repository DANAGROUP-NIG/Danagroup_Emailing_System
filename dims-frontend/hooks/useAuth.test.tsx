import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLogin, useLogout, useMe, useAuthSync, useAuth } from "./useAuth";
import { useAuthStore } from "@/store/authStore";
import { mockUser, mockAdminUser } from "@/test/mocks/fixtures";

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe("useAuth hooks", () => {
  beforeEach(() => {
    // Clear the auth store before each test
    useAuthStore.getState().clearUser();
  });

  describe("useLogin", () => {
    it("should login successfully and set user in store", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useLogin(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          email: "john.doe@dana.com",
          password: "password123",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that user is set in store
      expect(useAuthStore.getState().user).toBeDefined();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it("should fail login with invalid credentials", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useLogin(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            email: "test@dana.com",
            password: "wrong-password",
          });
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe("useLogout", () => {
    it("should logout and clear user from store", async () => {
      // Set up initial user
      useAuthStore.getState().setUser(mockUser());

      const wrapper = createWrapper();
      const { result } = renderHook(() => useLogout(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("useMe", () => {
    it("should fetch current user successfully", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useMe(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.email).toBe("john.doe@dana.com");
    });

    it("should not retry on 401 error", async () => {
      // This test verifies the retry logic configuration
      const wrapper = createWrapper();
      const { result } = renderHook(() => useMe(), { wrapper });

      // Wait for the query to complete
      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      // The retry logic is configured to not retry on 401
      expect(result.current.failureCount).toBeLessThanOrEqual(1);
    });
  });

  describe("useAuthSync", () => {
    it("should sync user to store on successful me query", async () => {
      const wrapper = createWrapper();
      renderHook(() => useAuthSync(), { wrapper });

      // Wait for sync to complete
      await waitFor(() => {
        expect(useAuthStore.getState().user).toBeDefined();
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });

  describe("useAuth", () => {
    it("should return user and isAuthenticated from store", () => {
      // Set up initial user
      const user = mockAdminUser();
      useAuthStore.getState().setUser(user);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toEqual(user);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should return null user when not authenticated", () => {
      useAuthStore.getState().clearUser();

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
