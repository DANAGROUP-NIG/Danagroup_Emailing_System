'use client';

import { useCallback, useEffect, useState } from 'react';
import { Command } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
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
        type="button"
        onClick={() => setOpen(true)}
        className="relative z-10 w-full max-w-md flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-accent/50 hover:bg-accent transition-colors text-sm text-muted-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Search size={16} className="shrink-0" />
        <span className="flex-1 text-left">{placeholder}</span>
        <kbd className="text-xs font-medium px-2 py-0.5 rounded border border-border bg-background text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed left-1/2 top-[20%] z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 rounded-xl border border-border bg-card shadow-dana-lg outline-none overflow-hidden"
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">Search</Dialog.Title>
            <Command shouldFilter={false}>
              <div className="flex items-center gap-2 border-b border-border px-3">
                <Search size={16} className="shrink-0 text-muted-foreground" />
                <Command.Input
                  placeholder={placeholder}
                  value={query}
                  onValueChange={setQuery}
                  className="flex-1 h-11 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              <Command.List className="max-h-[300px] overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  {query.length < 2 ? 'Type at least 2 characters to search...' : 'No results found.'}
                </Command.Empty>

                {results.mails.length > 0 && (
                  <Command.Group heading="Mails" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                    {results.mails.map((mail) => (
                      <Command.Item
                        key={mail.id}
                        value={mail.id}
                        onSelect={() => handleSelectMail(mail.url)}
                        className="flex flex-col gap-0.5 rounded-lg px-2 py-2 text-sm cursor-pointer aria-selected:bg-accent"
                      >
                        <span className="font-medium text-foreground">{mail.title}</span>
                        <span className="text-xs text-muted-foreground truncate">{mail.subtitle}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {results.users.length > 0 && (
                  <Command.Group heading="Contacts" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                    {results.users.map((user) => (
                      <Command.Item
                        key={user.id}
                        value={user.id}
                        onSelect={() => {
                          router.push(user.url);
                          setOpen(false);
                          setQuery('');
                        }}
                        className="flex flex-col gap-0.5 rounded-lg px-2 py-2 text-sm cursor-pointer aria-selected:bg-accent"
                      >
                        <span className="font-medium text-foreground">{user.title}</span>
                        <span className="text-xs text-muted-foreground">{user.subtitle}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>
            </Command>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
