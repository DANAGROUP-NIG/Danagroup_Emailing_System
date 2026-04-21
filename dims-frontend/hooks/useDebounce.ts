"use client";

import { useEffect, useState } from "react";

/**
 * useDebounce Hook
 * Delay updating a value until a specified time has passed.
 * Useful for preventing API spam in the RecipientInput autocomplete.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes before the delay is hit
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
