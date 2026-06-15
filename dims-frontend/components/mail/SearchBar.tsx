'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from 'cmdk';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { searchApi } from '@/lib/api';
import type { SearchResult } from '@/types/api.types';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  placeholder?: string;
}

export default function SearchBar({ placeholder = 'Search mail, contacts...' }: SearchBarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ mails: SearchResult[]; users: SearchResult[] }>({ mails: [], users: [] });
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
        searchApi.search({ q: debouncedQuery, type: 'mail', limit: 8 }).catch(() => null),
        searchApi.search({ q: debouncedQuery, type: 'users', limit: 5 }).catch(() => null),
      ]).then(([mailRes, userRes]) => {
        const mailResults = mailRes?.data?.data?.results ?? [];
        const userResults = userRes?.data?.data?.results ?? [];
        setResults({ mails: mailResults, users: userResults });
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
              {results.mails.map((mail) => (
                <CommandItem
                  key={mail.id}
                  onSelect={() => handleSelectMail(mail.url)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{mail.title}</span>
                    <span className="text-xs text-muted-foreground truncate">{mail.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.users.length > 0 && (
            <CommandGroup heading="Contacts">
              {results.users.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => {
                    router.push(user.url);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{user.title}</span>
                    <span className="text-xs text-muted-foreground">{user.subtitle}</span>
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
