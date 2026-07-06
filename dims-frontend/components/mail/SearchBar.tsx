'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Mail, User } from 'lucide-react';
import { searchApi } from '@/lib/api';
import type { SearchResult } from '@/types/api.types';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
}

export default function SearchBar({ placeholder = 'Search mail, contacts...' }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<{ mails: SearchResult[]; users: SearchResult[] }>({ mails: [], users: [] });
  const [activeIndex, setActiveIndex] = useState(0);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allResults = useMemo(() => [...results.mails, ...results.users], [results]);
  const hasResults = allResults.length > 0;

  // Search mails and users
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      Promise.all([
        searchApi.search({ q: debouncedQuery, type: 'mail', limit: 5 }).catch(() => null),
        searchApi.search({ q: debouncedQuery, type: 'users', limit: 4 }).catch(() => null),
      ]).then(([mailRes, userRes]) => {
        const mailResults = mailRes?.data?.data?.results ?? [];
        const userResults = userRes?.data?.data?.results ?? [];
        setResults({ mails: mailResults, users: userResults });
        setActiveIndex(0);
      });
    } else {
      setResults({ mails: [], users: [] });
    }
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((result: SearchResult) => {
    router.push(result.url);
    setQuery('');
    setIsOpen(false);
    setResults({ mails: [], users: [] });
  }, [router]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!hasResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % allResults.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
        break;
      case 'Enter':
        e.preventDefault();
        const result = allResults[activeIndex];
        if (result) {
          handleSelect(result);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [hasResults, allResults, activeIndex, handleSelect]);

  const clearSearch = () => {
    setQuery('');
    setResults({ mails: [], users: [] });
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div
        className={cn(
          'relative flex items-center gap-2 px-3 py-2 rounded-lg border bg-accent/50 transition-all',
          isOpen ? 'border-primary ring-2 ring-primary/20 bg-accent' : 'border-border hover:bg-accent'
        )}
      >
        <Search size={16} className="shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          role="combobox"
          aria-label="Search"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-activedescendant={hasResults ? `search-item-${activeIndex}` : undefined}
        />
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        ) : (
          <kbd className="text-xs font-medium px-1.5 py-0.5 rounded border border-border bg-background text-muted-foreground">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Inline Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div
          id="search-results"
          className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border bg-card shadow-dana-lg overflow-hidden"
        >
          {!hasResults ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto py-2">
              {/* Mails Section */}
              {results.mails.length > 0 && (
                <div className="px-2 pb-2">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Mail size={12} className="inline mr-1" />
                    Mails
                  </div>
                  {results.mails.map((mail, idx) => (
                    <button
                      key={mail.id}
                      id={`search-item-${idx}`}
                      onClick={() => handleSelect(mail)}
                      className={cn(
                        'w-full flex flex-col gap-0.5 rounded-md px-2 py-2 text-left text-sm transition-colors',
                        activeIndex === idx ? 'bg-accent' : 'hover:bg-accent/50'
                      )}
                    >
                      <span className="font-medium text-foreground truncate">{mail.title}</span>
                      <span className="text-xs text-muted-foreground truncate">{mail.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Users Section */}
              {results.users.length > 0 && (
                <div className="px-2 pt-2 border-t border-border">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <User size={12} className="inline mr-1" />
                    Contacts
                  </div>
                  {results.users.map((user, idx) => {
                    const globalIdx = results.mails.length + idx;
                    return (
                      <button
                        key={user.id}
                        id={`search-item-${globalIdx}`}
                        onClick={() => handleSelect(user)}
                        className={cn(
                          'w-full flex flex-col gap-0.5 rounded-md px-2 py-2 text-left text-sm transition-colors',
                          activeIndex === globalIdx ? 'bg-accent' : 'hover:bg-accent/50'
                        )}
                      >
                        <span className="font-medium text-foreground">{user.title}</span>
                        <span className="text-xs text-muted-foreground">{user.subtitle}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
