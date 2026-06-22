import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminGuard } from "./AdminGuard";
import { useAuthStore } from "@/store/authStore";
import { mockUser, mockAdminUser } from "@/test/mocks/fixtures";

describe("AdminGuard", () => {
  beforeEach(() => {
    // Clear auth state before each test
    useAuthStore.getState().clearUser();
  });

  it("should render children for admin users", () => {
    useAuthStore.getState().setUser(mockAdminUser());

    render(
      <AdminGuard>
        <div data-testid="protected-content">Admin Panel</div>
      </AdminGuard>
    );

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });

  it("should show access denied for non-admin users", () => {
    useAuthStore.getState().setUser(mockUser());

    render(
      <AdminGuard>
        <div data-testid="protected-content">Admin Panel</div>
      </AdminGuard>
    );

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("should show not authenticated when user is null", () => {
    // Ensure user is cleared
    useAuthStore.getState().clearUser();

    render(
      <AdminGuard>
        <div data-testid="protected-content">Admin Panel</div>
      </AdminGuard>
    );

    expect(screen.getByText("Not authenticated")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("should allow subsidiary_admin with custom requiredRoles", () => {
    const subsidiaryAdmin = mockUser({
      role: "subsidiary_admin",
    });
    useAuthStore.getState().setUser(subsidiaryAdmin);

    render(
      <AdminGuard requiredRoles={["subsidiary_admin", "group_admin"]}>
        <div data-testid="protected-content">Admin Panel</div>
      </AdminGuard>
    );

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });

  it("should show return to inbox button for denied access", () => {
    useAuthStore.getState().setUser(mockUser());

    render(
      <AdminGuard>
        <div data-testid="protected-content">Admin Panel</div>
      </AdminGuard>
    );

    expect(screen.getByText("Return to Inbox")).toBeInTheDocument();
  });

  it("should show correct message for manager role", () => {
    const manager = mockUser({ role: "manager" });
    useAuthStore.getState().setUser(manager);

    render(
      <AdminGuard>
        <div data-testid="protected-content">Admin Panel</div>
      </AdminGuard>
    );

    expect(
      screen.getByText(/You don't have permission to access this area/i)
    ).toBeInTheDocument();
  });
});
