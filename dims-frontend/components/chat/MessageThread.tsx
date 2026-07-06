"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns/format";
import { isToday } from "date-fns/isToday";
import { isYesterday } from "date-fns/isYesterday";
import { Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { ChatMessage, ChatParticipant } from "@/types/chat.types";

function formatDay(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

function groupByDay(messages: ChatMessage[]): [string, ChatMessage[]][] {
  const groups: Map<string, ChatMessage[]> = new Map();
  for (const msg of messages) {
    const key = formatDay(msg.createdAt);
    const existing = groups.get(key) ?? [];
    existing.push(msg);
    groups.set(key, existing);
  }
  return Array.from(groups.entries());
}

interface MessageThreadProps {
  messages: ChatMessage[];
  currentUserId: string;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  otherParticipant: ChatParticipant;
}

export default function MessageThread({
  messages,
  currentUserId,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  otherParticipant,
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "" : "flex-row-reverse")}>
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <Skeleton className={cn("h-12 rounded-2xl", i % 2 === 0 ? "w-48" : "w-56")} />
          </div>
        ))}
      </div>
    );
  }

  const grouped = groupByDay(messages);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scroll-smooth">
      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-primary border border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            {isFetchingNextPage ? "Loading..." : "Load earlier messages"}
          </button>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Avatar
            name={`${otherParticipant.firstName} ${otherParticipant.lastName}`}
            src={otherParticipant.avatarUrl ?? undefined}
            size="lg"
          />
          <div>
            <p className="font-semibold text-foreground">
              {otherParticipant.firstName} {otherParticipant.lastName}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Send a message to start the conversation
            </p>
          </div>
        </div>
      ) : (
        grouped.map(([day, dayMessages]) => (
          <div key={day} className="space-y-2">
            {/* Day separator */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {day}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {dayMessages.map((msg) => {
              const isMine = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={cn("flex gap-2 items-end", isMine ? "flex-row-reverse" : "")}
                >
                  {!isMine && (
                    <Avatar
                      name={`${otherParticipant.firstName} ${otherParticipant.lastName}`}
                      src={otherParticipant.avatarUrl ?? undefined}
                      size="sm"
                      className="flex-shrink-0 mb-0.5"
                    />
                  )}
                  <div className={cn("flex flex-col gap-0.5 max-w-[70%]", isMine ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap",
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm",
                      )}
                    >
                      {msg.body}
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1">
                      {format(new Date(msg.createdAt), "h:mm a")}
                      {isMine && msg.isRead && (
                        <span className="ml-1 text-primary">✓✓</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}

      <div ref={bottomRef} />
    </div>
  );
}
