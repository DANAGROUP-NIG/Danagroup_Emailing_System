import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("should render with default props", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("should render different variants", () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<Button variant="link">Link</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should render different sizes", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should handle click events", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when isLoading is true", () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
  });

  it("should not trigger click when disabled", async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);

    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should render full width when fullWidth is true", () => {
    render(<Button fullWidth>Full Width</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });

  it("should render left icon", () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    render(<Button leftIcon={leftIcon}>With Left Icon</Button>);
    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
  });

  it("should render right icon", () => {
    const rightIcon = <span data-testid="right-icon">→</span>;
    render(<Button rightIcon={rightIcon}>With Right Icon</Button>);
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
  });

  it("should show spinner instead of left icon when loading", () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    render(<Button isLoading leftIcon={leftIcon}>Loading</Button>);
    expect(screen.queryByTestId("left-icon")).not.toBeInTheDocument();
  });

  it("should render as child component when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    expect(screen.getByRole("link", { name: /link button/i })).toBeInTheDocument();
  });
});
