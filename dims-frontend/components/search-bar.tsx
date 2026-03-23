'use client'

import { useEmailStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { SearchIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

export function SearchBar() {
  const store = useEmailStore()
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="px-6 py-4 border-b border-border bg-white">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-300 focus-within:bg-white focus-within:border-primary transition">
        <SearchIcon size={18} className="text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          placeholder="Search emails..."
          value={store.searchQuery}
          onChange={(e) => store.setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder-muted-foreground"
        />
        {store.searchQuery && (
          <button
            onClick={() => store.setSearchQuery('')}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <XIcon size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
