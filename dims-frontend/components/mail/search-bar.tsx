'use client'

import { Input } from '@/components/ui/input'
import { SearchIcon } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative flex-1 w-full max-w-lg">
      <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Search emails..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 h-10 rounded-full bg-muted/60 border-0 focus:bg-muted text-sm transition-colors"
      />
    </div>
  )
}
