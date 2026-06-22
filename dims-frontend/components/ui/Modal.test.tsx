import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "./Modal";

describe("Modal", () => {
  it("should render when open is true", () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("should not render when open is false", () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.queryByText("Modal content")).not.toBeInTheDocument();
  });

  it("should render title when provided", () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", async () => {
    const handleClose = vi.fn();
    render(
      <Modal open={true} onClose={handleClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    const closeButton = screen.getByLabelText("Close modal");
    await userEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("should render different sizes", () => {
    const { rerender } = render(
      <Modal open={true} onClose={vi.fn()} size="sm" title="Small">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText("Small")).toBeInTheDocument();

    rerender(
      <Modal open={true} onClose={vi.fn()} size="md" title="Medium">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText("Medium")).toBeInTheDocument();

    rerender(
      <Modal open={true} onClose={vi.fn()} size="lg" title="Large">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText("Large")).toBeInTheDocument();

    rerender(
      <Modal open={true} onClose={vi.fn()} size="xl" title="Extra Large">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByText("Extra Large")).toBeInTheDocument();
  });

  it("should have correct ARIA attributes", () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="Accessible Modal">
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("dialog")).toHaveAttribute(
      "aria-labelledby",
      "modal-title"
    );
  });

  it("should render screen reader only title when title is empty", () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <p>Content</p>
      </Modal>
    );
    // Should have a title for accessibility, even if visually hidden
    const title = screen.getByText("Modal");
    expect(title).toHaveClass("sr-only");
  });
});
