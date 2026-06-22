import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn, timeAgo, htmlToText } from "./utils";

describe("cn", () => {
  it("should merge class names correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    expect(
      cn("base", isActive && "active", isDisabled && "disabled")
    ).toBe("base active");
  });

  it("should handle tailwind conflicts by merging correctly", () => {
    expect(cn("p-4", "p-6")).toBe("p-6");
  });

  it("should handle clsx array syntax", () => {
    expect(cn(["class1", "class2"])).toBe("class1 class2");
  });

  it("should handle clsx object syntax", () => {
    expect(cn({ active: true, disabled: false })).toBe("active");
  });

  it("should handle mixed inputs", () => {
    expect(cn("base", ["array1", "array2"], { object: true }, null, undefined, "final")).toBe(
      "base array1 array2 object final"
    );
  });

  it("should filter out falsy values", () => {
    expect(cn("base", false, null, undefined, "", 0, "end")).toBe("base end");
  });
});

describe("timeAgo", () => {
  beforeEach(() => {
    // Mock Date to a fixed time
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return 'just now' for timestamps less than 60 seconds ago", () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe("just now");
  });

  it("should return minutes ago for timestamps less than 1 hour ago", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinutesAgo)).toBe("5m ago");
  });

  it("should return hours ago for timestamps less than 24 hours ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(twoHoursAgo)).toBe("2h ago");
  });

  it("should return days ago for timestamps less than 7 days ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeDaysAgo)).toBe("3d ago");
  });

  it("should return formatted date for timestamps older than 7 days", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const result = timeAgo(tenDaysAgo.toISOString());
    // Should be in format "5 Jan"
    expect(result).toMatch(/^\d{1,2} \w{3}$/);
  });

  it("should handle edge case at exactly 60 seconds", () => {
    const exactly60SecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
    expect(timeAgo(exactly60SecondsAgo)).toBe("1m ago");
  });

  it("should handle edge case at exactly 1 hour", () => {
    const exactly1HourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(timeAgo(exactly1HourAgo)).toBe("1h ago");
  });

  it("should handle edge case at exactly 24 hours", () => {
    const exactly24HoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(exactly24HoursAgo)).toBe("1d ago");
  });

  it("should handle edge case at exactly 7 days", () => {
    const exactly7DaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = timeAgo(exactly7DaysAgo.toISOString());
    // Should be formatted date, not "7d ago"
    expect(result).toMatch(/^\d{1,2} \w{3}$/);
  });
});

describe("htmlToText", () => {
  it("should return empty string for null input", () => {
    expect(htmlToText(null)).toBe("");
  });

  it("should return empty string for undefined input", () => {
    expect(htmlToText(undefined)).toBe("");
  });

  it("should return empty string for empty string input", () => {
    expect(htmlToText("")).toBe("");
  });

  it("should strip HTML tags in browser environment", () => {
    const html = "<p>Hello <strong>world</strong></p>";
    expect(htmlToText(html)).toBe("Hello world");
  });

  it("should handle nested HTML tags", () => {
    const html = "<div><p>Line 1</p><p>Line 2</p></div>";
    expect(htmlToText(html)).toBe("Line 1Line 2");
  });

  it("should handle HTML with attributes", () => {
    const html = '<p class="test" id="para">Content</p>';
    expect(htmlToText(html)).toBe("Content");
  });

  it("should handle plain text without HTML", () => {
    const text = "Plain text content";
    expect(htmlToText(text)).toBe("Plain text content");
  });

  it("should handle self-closing tags", () => {
    const html = "Line 1<br/>Line 2<hr/>Line 3";
    expect(htmlToText(html)).toBe("Line 1Line 2Line 3");
  });

  it("should handle special characters in HTML", () => {
    const html = "<p>Test &amp; Example &lt;tag&gt;</p>";
    expect(htmlToText(html)).toBe("Test & Example <tag>");
  });

  it("should trim whitespace from result", () => {
    const html = "  <p>  Content  </p>  ";
    expect(htmlToText(html)).toBe("Content");
  });
});
