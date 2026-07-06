"use client";

import { useState } from "react";
import { Hash, Lock, Plus, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { Channel } from "@/types/channel.types";

interface ChannelListProps {
  channels: Channel[];
  isLoading: boolean;
  activeId: string | null;
  onSelect: (ch: Channel) => void;
  onCreateNew: () => void;
}

export default function ChannelList({
  channels,
  isLoading,
  activeId,
  onSelect,
  onCreateNew,
}: ChannelListProps) {
  const [search, setSearch] = useState("");

  const filtered = channels.filter((ch) =>
    ch.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="space-y-1 p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-3">
            <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 pt-2 pb-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a channel…"
            className="w-full rounded-lg border border-border bg-muted/50 py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
          />
        </div>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto space-y-0.5 p-2">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">No channels found</p>
        ) : (
          filtered.map((ch) => {
            const isActive = ch.id === activeId;
            const hasUnread = (ch.unreadCount ?? 0) > 0;

            return (
              <button
                key={ch.id}
                onClick={() => onSelect(ch)}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {ch.type === "private" ? (
                  <Lock className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary-foreground/70" : "text-muted-foreground")} />
                ) : (
                  <Hash className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary-foreground/70" : "text-muted-foreground")} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={cn("truncate text-sm font-medium", hasUnread && !isActive ? "font-semibold" : "")}>
                      {ch.name}
                    </span>
                    {hasUnread && !isActive && (
                      <span className="flex-shrink-0 h-4 min-w-4 flex items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white px-1">
                        {(ch.unreadCount ?? 0) > 99 ? "99+" : ch.unreadCount}
                      </span>
                    )}
                  </div>
                  {ch.lastMessage && (
                    <p className={cn("truncate text-xs mt-0.5", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {ch.lastMessage.sender?.firstName}: {ch.lastMessage.body}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Create new */}
      <div className="border-t border-border p-2">
        <button
          onClick={onCreateNew}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Plus className="h-4 w-4" />
          New channel
        </button>
      </div>
    </div>
  );
}
