import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input, ComposeInput } from "./Input";

describe("Input", () => {
  it("should render basic input", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should render with label", () => {
    render(<Input label="Email" id="email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("should render with error message", () => {
    render(<Input error="Invalid email" id="email" />);
    expect(screen.getByText("Invalid email")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("should render with helper text", () => {
    render(<Input helperText="Enter your email" id="email" />);
    expect(screen.getByText("Enter your email")).toBeInTheDocument();
  });

  it("should handle value changes", async () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    await userEvent.type(screen.getByRole("textbox"), "test");
    expect(handleChange).toHaveBeenCalled();
  });

  it("should render left icon", () => {
    const leftIcon = <span data-testid="left-icon">@</span>;
    render(<Input leftIcon={leftIcon} />);
    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
  });

  it("should render right icon", () => {
    const rightIcon = <span data-testid="right-icon">✓</span>;
    render(<Input rightIcon={rightIcon} />);
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
  });

  it("should render full width", () => {
    render(<Input fullWidth data-testid="input-container" />);
    expect(screen.getByTestId("input-container")).toHaveClass("w-full");
  });

  it("should handle disabled state", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("should forward ref correctly", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  describe("textarea variant", () => {
    it("should render as textarea when as='textarea'", () => {
      render(<Input as="textarea" label="Description" />);
      expect(screen.getByLabelText("Description")).toBeInstanceOf(HTMLTextAreaElement);
    });

    it("should apply rows to textarea", () => {
      render(<Input as="textarea" rows={5} label="Description" />);
      expect(screen.getByLabelText("Description")).toHaveAttribute("rows", "5");
    });
  });

  describe("ComposeInput", () => {
    it("should render with label and error from errors object", () => {
      render(<ComposeInput label="To" errors={{ message: "Invalid recipient" }} />);
      expect(screen.getByLabelText("To")).toBeInTheDocument();
      expect(screen.getByText("Invalid recipient")).toBeInTheDocument();
    });

    it("should forward ref correctly", () => {
      const ref = { current: null as HTMLInputElement | null };
      render(<ComposeInput ref={ref} label="To" />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });
});
