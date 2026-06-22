import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar, getInitials } from "./Avatar";

describe("getInitials", () => {
  it("should return initials from first and last name", () => {
    expect(getInitials("John", "Doe")).toBe("JD");
  });

  it("should return single initial if only first name provided", () => {
    expect(getInitials("John", "")).toBe("J");
  });

  it("should return single initial if only last name provided", () => {
    expect(getInitials("", "Doe")).toBe("D");
  });

  it("should return DG fallback if no names provided", () => {
    expect(getInitials("", "")).toBe("DG");
  });

  it("should return uppercase initials", () => {
    expect(getInitials("john", "doe")).toBe("JD");
  });

  it("should handle undefined inputs", () => {
    expect(getInitials(undefined, undefined)).toBe("DG");
  });
});

describe("Avatar", () => {
  it("should render with image when src is provided", () => {
    render(
      <Avatar
        name="John Doe"
        src="https://example.com/avatar.jpg"
        data-testid="avatar"
      />
    );
    expect(screen.getByTestId("avatar")).toBeInTheDocument();
  });

  it("should render fallback with initials when no image", () => {
    render(<Avatar name="John Doe" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toBeInTheDocument();
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("should render different sizes", () => {
    const { rerender } = render(<Avatar name="Test" size="xs" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toBeInTheDocument();

    rerender(<Avatar name="Test" size="sm" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toBeInTheDocument();

    rerender(<Avatar name="Test" size="md" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toBeInTheDocument();

    rerender(<Avatar name="Test" size="lg" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toBeInTheDocument();

    rerender(<Avatar name="Test" size="xl" data-testid="avatar" />);
    expect(screen.getByTestId("avatar")).toBeInTheDocument();
  });

  it("should render status indicator when status is provided", () => {
    render(<Avatar name="Test" status="online" data-testid="avatar" />);
    expect(screen.getByLabelText("online")).toBeInTheDocument();
  });

  it("should render online status", () => {
    render(<Avatar name="Test" status="online" data-testid="avatar" />);
    expect(screen.getByLabelText("online")).toHaveClass("bg-success");
  });

  it("should render offline status", () => {
    render(<Avatar name="Test" status="offline" data-testid="avatar" />);
    expect(screen.getByLabelText("offline")).toHaveClass("bg-muted-foreground");
  });

  it("should render busy status", () => {
    render(<Avatar name="Test" status="busy" data-testid="avatar" />);
    expect(screen.getByLabelText("busy")).toHaveClass("bg-warning");
  });

  it("should use custom initials when provided", () => {
    render(<Avatar name="John Doe" initials="XY" data-testid="avatar" />);
    expect(screen.getByText("XY")).toBeInTheDocument();
  });

  it("should use avatarUrl when provided", () => {
    render(
      <Avatar
        name="John Doe"
        avatarUrl="https://example.com/photo.jpg"
        data-testid="avatar"
      />
    );
    expect(screen.getByTestId("avatar")).toBeInTheDocument();
  });

  it("should prioritize src over avatarUrl", () => {
    render(
      <Avatar
        name="John Doe"
        src="https://example.com/src.jpg"
        avatarUrl="https://example.com/avatar.jpg"
        data-testid="avatar"
      />
    );
    expect(screen.getByTestId("avatar")).toBeInTheDocument();
  });
});
