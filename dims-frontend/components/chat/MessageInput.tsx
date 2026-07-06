"use client";

import { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (body: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({ onSend, disabled, placeholder }: MessageInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="flex items-end gap-2 border-t border-border bg-background px-4 py-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Type a message… (Enter to send, Shift+Enter for newline)"}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "min-h-[40px] max-h-[120px] leading-relaxed",
        )}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
          canSend
            ? "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm"
            : "bg-muted text-muted-foreground cursor-not-allowed",
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
