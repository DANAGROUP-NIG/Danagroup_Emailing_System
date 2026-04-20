"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce"; // Assume standard debounce hook
import Avatar from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { User } from "@/types/user.types";

// TODO: Implement RecipientInput Component
// Props: value: User[], onChange: (users: User[]) => void, placeholder?: string
// - Tag-based recipient selector with autocomplete from employee directory
// - Queries GET /api/users/search?q= (enabled after 2+ chars, debounced)
// - Shows dropdown of matching employees with Avatar + name + email
// - Selected recipients shown as dismissible tags (dana-blue-50 bg)
// - Supports keyboard navigation (arrow keys, Enter to select, Backspace to remove)
// - Validates that all recipients are @*.internal domain users


interface RecipientInputProps {
  value: User[];
  onChange: (users: User[]) => void;
  placeholder?: string;
}

export default function RecipientInput({ value, onChange, placeholder }: RecipientInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          // Validate @*.internal domain if not handled by API
          const filtered = data.filter((u: User) => u.email.endsWith(".internal"));
          setSuggestions(filtered);
          setIsOpen(true);
          setSelectedIndex(0);
        });
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [debouncedQuery]);

  const addRecipient = (user: User) => {
    if (!value.find((v) => v.id === user.id)) {
      onChange([...value, user]);
    }
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeRecipient = (id: string) => {
    onChange(value.filter((u) => u.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !query && value.length > 0) {
      removeRecipient(value[value.length - 1].id);
    } else if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && isOpen && suggestions[selectedIndex]) {
      e.preventDefault();
      addRecipient(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative flex flex-1 flex-wrap items-center gap-2 min-h-[32px]">
      {value.map((user) => (
        <span
          key={user.id}
          className="flex items-center gap-1 bg-dana-blue/10 text-dana-blue text-xs font-medium px-2 py-1 rounded-full border border-dana-blue/20"
        >
          {user.firstName} {user.lastName}
          <button onClick={() => removeRecipient(user.id)} className="hover:text-dana-blue-dark">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
      />

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-border rounded-md shadow-lg z-[60] max-h-60 overflow-y-auto">
          {suggestions.map((user, index) => (
            <div
              key={user.id}
              onClick={() => addRecipient(user)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
                index === selectedIndex ? "bg-slate-50" : "hover:bg-slate-50"
              )}
            >
              <Avatar src={user.avatarUrl} name={user.firstName} size="sm" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{user.firstName} {user.lastName}</span>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
