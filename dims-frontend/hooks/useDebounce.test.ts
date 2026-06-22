import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));
    expect(result.current).toBe("initial");
  });

  it("should debounce value updates", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      }
    );

    // Update the value
    rerender({ value: "updated", delay: 500 });

    // Value should still be initial (debounce hasn't fired)
    expect(result.current).toBe("initial");

    // Fast-forward time
    act(() => { vi.advanceTimersByTime(500); });

    // Now value should be updated
    expect(result.current).toBe("updated");
  });

  it("should reset timer when value changes before delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      }
    );

    // First update
    rerender({ value: "first", delay: 500 });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe("initial");

    // Second update (resets timer)
    rerender({ value: "second", delay: 500 });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe("initial");

    // Complete the delay
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe("second");
  });

  it("should handle numeric values", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 300 },
      }
    );

    rerender({ value: 42, delay: 300 });
    expect(result.current).toBe(0);

    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe(42);
  });

  it("should handle object values", () => {
    const initialObj = { a: 1 };
    const updatedObj = { a: 2 };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: initialObj, delay: 200 },
      }
    );

    rerender({ value: updatedObj, delay: 200 });
    expect(result.current).toBe(initialObj);

    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe(updatedObj);
  });

  it("should handle array values", () => {
    const initialArr = [1, 2, 3];
    const updatedArr = [4, 5, 6];

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: initialArr, delay: 200 },
      }
    );

    rerender({ value: updatedArr, delay: 200 });
    expect(result.current).toBe(initialArr);

    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe(updatedArr);
  });

  it("should handle null values", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }: { value: string | null; delay: number }) =>
        useDebounce<string | null>(value, delay),
      {
        initialProps: { value: "value" as string | null, delay: 200 },
      }
    );

    rerender({ value: null, delay: 200 });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBeNull();
  });

  it("should handle delay changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      }
    );

    rerender({ value: "updated", delay: 100 });

    // With new shorter delay
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe("updated");
  });

  it("should clean up timeout on unmount", () => {
    const { result, rerender, unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      }
    );

    rerender({ value: "updated", delay: 500 });
    unmount();

    // Timer should be cleaned up, so advancing time shouldn't cause issues
    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current).toBe("initial");
  });
});
