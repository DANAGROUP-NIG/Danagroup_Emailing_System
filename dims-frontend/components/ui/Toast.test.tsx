import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { ToastProvider, useToast } from "./Toast";
import React from "react";

// Test component that uses the toast
const TestComponent = () => {
  const { showToast } = useToast();
  return (
    <div>
      <button
        onClick={() =>
          showToast({ title: "Test Toast", variant: "success" })
        }
        data-testid="show-toast"
      >
        Show Toast
      </button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactNode) => {
  return render(<ToastProvider>{component}</ToastProvider>);
};

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render toast provider with children", () => {
    renderWithProvider(<div data-testid="child">Child Content</div>);
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("should throw error when useToast is used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const InvalidComponent = () => {
      useToast();
      return null;
    };

    expect(() => render(<InvalidComponent />)).toThrow(
      "useToast must be used within <ToastProvider>"
    );

    consoleSpy.mockRestore();
  });

  it("should show toast when showToast is called", async () => {
    renderWithProvider(<TestComponent />);

    await act(async () => {
      screen.getByTestId("show-toast").click();
    });

    expect(screen.getByText("Test Toast")).toBeInTheDocument();
  });

  it("should auto-dismiss toast after timeout", async () => {
    renderWithProvider(<TestComponent />);

    await act(async () => {
      screen.getByTestId("show-toast").click();
    });

    expect(screen.getByText("Test Toast")).toBeInTheDocument();

    // Fast-forward time to trigger auto-dismiss
    act(() => {
      vi.advanceTimersByTime(4500);
    });

    await waitFor(() => {
      expect(screen.queryByText("Test Toast")).not.toBeInTheDocument();
    });
  });

  it("should render different variants", async () => {
    const VariantTest = () => {
      const { showToast } = useToast();
      return (
        <div>
          <button
            onClick={() =>
              showToast({ title: "Success Toast", variant: "success" })
            }
            data-testid="success"
          >
            Success
          </button>
          <button
            onClick={() => showToast({ title: "Error Toast", variant: "error" })}
            data-testid="error"
          >
            Error
          </button>
        </div>
      );
    };

    renderWithProvider(<VariantTest />);

    await act(async () => {
      screen.getByTestId("success").click();
    });

    expect(screen.getByText("Success Toast")).toBeInTheDocument();

    await act(async () => {
      screen.getByTestId("error").click();
    });

    expect(screen.getByText("Error Toast")).toBeInTheDocument();
  });

  it("should render toast with description", async () => {
    const DescTest = () => {
      const { showToast } = useToast();
      return (
        <button
          onClick={() =>
            showToast({
              title: "Title",
              description: "Description text",
              variant: "success",
            })
          }
          data-testid="show"
        >
          Show
        </button>
      );
    };

    renderWithProvider(<DescTest />);

    await act(async () => {
      screen.getByTestId("show").click();
    });

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description text")).toBeInTheDocument();
  });

  it("should have close button on toast", async () => {
    renderWithProvider(<TestComponent />);

    await act(async () => {
      screen.getByTestId("show-toast").click();
    });

    expect(screen.getByText("Test Toast")).toBeInTheDocument();
    expect(screen.getByLabelText("Close notification")).toBeInTheDocument();
  });
});
