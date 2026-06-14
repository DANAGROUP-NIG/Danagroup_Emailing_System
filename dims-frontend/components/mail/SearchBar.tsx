'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'cmdk';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { mailApi } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  placeholder?: string;
}

export default function SearchBar({ placeholder = 'Search mail, contacts...' }: SearchBarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({ mails: [], users: [] });
  const debouncedQuery = useDebounce(query, 300);

  // Cmd+K / Ctrl+K to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search mails and users
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      Promise.all([
        mailApi.searchMessages(debouncedQuery).catch(() => []),
        mailApi.getRecipientSuggestions(debouncedQuery).catch(() => []),
      ]).then(([mails, users]) => {
        setResults({
          mails: Array.isArray(mails) ? mails : mails?.data || [],
          users: Array.isArray(users) ? users : users?.data || [],
        });
      });
    } else {
      setResults({ mails: [], users: [] });
    }
  }, [debouncedQuery]);

  const handleSelectMail = useCallback(
    (threadId: string) => {
      router.push(`/mail/inbox/${threadId}`);
      setOpen(false);
      setQuery('');
    },
    [router]
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors text-sm text-muted-foreground"
      >
        <Search size={16} />
        <span className="flex-1 text-left">{placeholder}</span>
        <kbd className="text-xs font-medium px-2 py-0.5 rounded bg-gray-200 text-gray-600">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {results.mails.length > 0 && (
            <CommandGroup heading="Mails">
              {results.mails.map((mail: any) => (
                <CommandItem
                  key={mail.id || mail.threadId}
                  onSelect={() => handleSelectMail(mail.threadId || mail.id)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{mail.subject}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {mail.sender?.name || mail.sender?.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.users.length > 0 && (
            <CommandGroup heading="Contacts">
              {results.users.map((user: any) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => {
                    // Could navigate to compose with this contact
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
