"use client";

import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { ChatConversation } from "@/types/chat.types";

interface ConversationListProps {
  conversations: ChatConversation[];
  isLoading: boolean;
  activeId: string | null;
  currentUserId: string;
  onSelect: (conv: ChatConversation) => void;
}

export default function ConversationList({
  conversations,
  isLoading,
  activeId,
  currentUserId,
  onSelect,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-1 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-3">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </span>
        <p className="text-sm font-medium text-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground">
          Start a chat from the Directory
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 p-2">
      {conversations.map((conv) => {
        const other =
          conv.participantAId === currentUserId ? conv.participantB : conv.participantA;
        const name = `${other.firstName} ${other.lastName}`;
        const isActive = conv.id === activeId;
        const hasUnread = (conv.unreadCount ?? 0) > 0;

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-foreground",
            )}
          >
            <Avatar
              name={name}
              src={other.avatarUrl ?? undefined}
              size="md"
              className="flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn("truncate text-sm font-medium", isActive ? "text-primary-foreground" : "text-foreground")}>
                  {name}
                </p>
                {conv.lastMessageAt && (
                  <span className={cn("text-[10px] flex-shrink-0", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1">
                <p className={cn("truncate text-xs mt-0.5", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {conv.lastMessage?.body ?? "Start a conversation"}
                </p>
                {hasUnread && !isActive && (
                  <span className="flex-shrink-0 h-5 min-w-5 flex items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white px-1">
                    {(conv.unreadCount ?? 0) > 99 ? "99+" : conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
