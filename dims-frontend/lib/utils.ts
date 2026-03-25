// TODO: Implement utility functions

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// TODO: Add helpers:
// formatDate(date: Date | string): string — uses date-fns formatDistanceToNow for recent, format for older
// formatFileSize(bytes: number): string — e.g. "2.4 MB"
// getInitials(firstName: string, lastName: string): string — e.g. "JD"
// truncate(str: string, maxLength: number): string
// isInternalEmail(email: string): boolean — checks for @*.internal domain
