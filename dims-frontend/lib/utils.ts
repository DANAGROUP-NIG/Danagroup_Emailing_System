// TODO: Implement utility functions

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Relative time formatter for notifications
export function timeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}


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

