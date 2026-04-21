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


// Converts HTML string to plain text safely
export const htmlToText = (html: string | null | undefined): string => {
  if (!html) return "";

  // Safety for Server-Side Rendering (SSR)
  if (typeof window === "undefined") {
    // Fallback: simple regex to strip tags if window is not available
    return html.replace(/<[^>]*>/g, "").trim();
  }

  //Browser-based conversion
  const tempDiv: HTMLDivElement = document.createElement("div");
  tempDiv.innerHTML = html;
  
  return tempDiv.textContent || tempDiv.innerText || "";
};

