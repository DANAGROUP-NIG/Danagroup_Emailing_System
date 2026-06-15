import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MailListItem from "./MailListItem";
import { mockMailThreadSummary } from "@/test/mocks/fixtures";

describe("MailListItem", () => {
  it("should render thread information", () => {
    const thread = mockMailThreadSummary();
    render(
      <MailListItem
        thread={thread}
        onClick={vi.fn()}
        onStar={vi.fn()}
      />
    );

    expect(screen.getByText("Test Subject")).toBeInTheDocument();
  });

  it("should handle click events", async () => {
    const handleClick = vi.fn();
    const thread = mockMailThreadSummary();

    render(<MailListItem thread={thread} onClick={handleClick} />);

    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should show selected state", () => {
    const thread = mockMailThreadSummary();
    render(<MailListItem thread={thread} isSelected={true} />);

    expect(screen.getByRole("button")).toHaveClass("selected");
  });

  it("should show unread state", () => {
    const thread = mockMailThreadSummary({ unreadCount: 2 });
    render(<MailListItem thread={thread} />);

    expect(screen.getByRole("button")).toHaveClass("unread");
  });

  it("should show unread count badge", () => {
    const thread = mockMailThreadSummary({ unreadCount: 5 });
    render(<MailListItem thread={thread} />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should handle star toggle", async () => {
    const handleStar = vi.fn();
    const thread = mockMailThreadSummary({ isStarred: false });

    render(<MailListItem thread={thread} onStar={handleStar} />);

    const starButton = screen.getByLabelText("Star");
    await userEvent.click(starButton);

    expect(handleStar).toHaveBeenCalledWith("thread-1", true);
  });

  it("should show starred state", () => {
    const thread = mockMailThreadSummary({ isStarred: true });
    render(<MailListItem thread={thread} />);

    expect(screen.getByLabelText("Unstar")).toBeInTheDocument();
  });

  it("should handle keyboard navigation", async () => {
    const handleClick = vi.fn();
    const thread = mockMailThreadSummary();

    render(<MailListItem thread={thread} onClick={handleClick} />);

    const item = screen.getByRole("button");
    item.focus();

    await userEvent.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledTimes(1);

    handleClick.mockClear();

    await userEvent.keyboard(" ");
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should show sender information", () => {
    const thread = mockMailThreadSummary();
    render(<MailListItem thread={thread} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should show message preview", () => {
    const thread = mockMailThreadSummary();
    render(<MailListItem thread={thread} />);

    expect(screen.getByText(/test message body/i)).toBeInTheDocument();
  });

  it("should show timestamp", () => {
    const thread = mockMailThreadSummary({
      updatedAt: new Date().toISOString(),
    });
    render(<MailListItem thread={thread} />);

    // Should show time ago format
    expect(screen.getByText(/ago|just now/i)).toBeInTheDocument();
  });

  it("should handle star click without triggering thread click", async () => {
    const handleClick = vi.fn();
    const handleStar = vi.fn();
    const thread = mockMailThreadSummary();

    render(
      <MailListItem
        thread={thread}
        onClick={handleClick}
        onStar={handleStar}
      />
    );

    const starButton = screen.getByLabelText("Star");
    await userEvent.click(starButton);

    expect(handleStar).toHaveBeenCalledTimes(1);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
