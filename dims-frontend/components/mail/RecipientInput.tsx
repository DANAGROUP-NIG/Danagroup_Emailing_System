'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Avatar, getInitials } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { mailApi } from '@/lib/api';
import { ParticipantSummary } from '@/types/mail.types';
import * as Popover from '@radix-ui/react-popover';

interface RecipientInputProps {
  value: ParticipantSummary[];
  onChange: (recipients: ParticipantSummary[]) => void;
  placeholder?: string;
  label?: string;
}

export default function RecipientInput({
  value,
  onChange,
  placeholder = 'Add recipients...',
  label,
}: RecipientInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ParticipantSummary[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions from directory API
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      mailApi
        .getRecipientSuggestions(debouncedQuery)
        .then((res) => {
          // API returns { data: [...] }
          const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
          setSuggestions(data.slice(0, 10));
          setOpen(true);
          setSelectedIndex(0);
        })
        .catch(() => {
          setSuggestions([]);
        });
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  }, [debouncedQuery]);

  const addRecipient = useCallback(
    (recipient: ParticipantSummary) => {
      if (!value.find((v) => v.id === recipient.id)) {
        onChange([...value, recipient]);
      }
      setQuery('');
      setOpen(false);
      inputRef.current?.focus();
    },
    [value, onChange]
  );

  const removeRecipient = useCallback(
    (id: string) => {
      onChange(value.filter((r) => r.id !== id));
    },
    [value, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !query && value.length > 0) {
      removeRecipient(value[value.length - 1].id);
    } else if (e.key === 'ArrowDown' && open && suggestions.length > 0) {
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && open && suggestions.length > 0) {
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && open && suggestions[selectedIndex]) {
      e.preventDefault();
      addRecipient(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="space-y-2">
        {label && <label className="text-sm font-medium text-foreground">{label}</label>}
        <Popover.Trigger asChild>
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-white p-2 focus-within:ring-2 focus-within:ring-primary">
            {value.map((recipient) => (
              <div
                key={recipient.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary"
              >
                <span>{recipient.name || recipient.email}</span>
                <button
                  type="button"
                  onClick={() => removeRecipient(recipient.id)}
                  className="text-primary/60 hover:text-primary"
                  aria-label={`Remove ${recipient.name || recipient.email}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={value.length === 0 ? placeholder : ''}
              className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
          </div>
        </Popover.Trigger>

        {/* Suggestions Dropdown */}
        <Popover.Content side="bottom" align="start" className="w-full p-0 rounded-md border border-input shadow-md z-50">
          {suggestions.length > 0 ? (
            <div className="max-h-60 overflow-y-auto bg-white">
              {suggestions.map((recipient, index) => (
                <button
                  key={recipient.id}
                  type="button"
                  onClick={() => addRecipient(recipient)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                    index === selectedIndex ? 'bg-primary/10' : 'hover:bg-gray-50'
                  )}
                >
                  <Avatar
                    name={recipient.name}
                    initials={getInitials(recipient.name, '')}
                    avatarUrl={recipient.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-foreground">
                      {recipient.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{recipient.email}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No recipients found
            </div>
          ) : null}
        </Popover.Content>
      </div>
    </Popover.Root>
  );
}

