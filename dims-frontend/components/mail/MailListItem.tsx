"use client";

import { formatDistanceToNow } from "date-fns";
import { Star } from "lucide-react";
import { useMail } from "@/hooks/useMail";

// TODO: Implement MailListItem Component
// Ensure you do not delet the comments. just implement the the todos under each
// Props: thread: Thread, isSelected: boolean, onClick: () => void
// - Renders a single row in the mail list using .mail-list-item CSS class
// - Applies .unread class when thread has unread messages
// - Applies .selected class when this thread is active
// - Shows: sender avatar, sender name, subject, snippet, relative date (date-fns)
// - Shows star toggle icon (calls PATCH /api/mail/:id/star)
// - Shows unread dot indicator for unread messages

export default function MailListItem({ 
  thread, 
  isSelected, 
  onClick 
}: { 
  thread: any; 
  isSelected: boolean; 
  onClick: () => void; 
}) {
  const { useStarMail } = useMail();
  const starMail = useStarMail();
  const messageId = thread.messageId || thread.latestMessage?.id || thread.id;

  const handleStarToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    starMail.mutate({
      id: messageId,
      isStarred: !thread.starred,
    });
  };

  const initials = thread.senderName
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={`mail-list-item w-full text-left transition-colors ${
        thread.unread ? "unread" : ""
      } ${isSelected ? "selected" : ""}`}
    >
      {/* Sender Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dana-blue text-sm font-semibold text-white">
        {initials}
      </div>

      <div className="min-w-0 flex-1 flex flex-col gap-1 ">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            {/* Sender Name */}
            <span className="truncate text-sm font-semibold text-foreground">
              {thread.senderName}
            </span>
            {/* Unread Dot Indicator */}
            {thread.unread && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-dana-blue" />
            )}
          </div>
          {/* Relative Date */}
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
          </span>
        </div>

        {/* Subject */}
        <p className="truncate text-sm font-medium text-foreground">
          {thread.subject}
        </p>

        {/* Snippet */}
        <p className="truncate text-xs text-muted-foreground">
          {thread.snippet}
        </p>
      </div>

      {/* Star Toggle Icon */}
      <button
        onClick={handleStarToggle}
        className="ml-2 shrink-0 self-center transition-transform hover:scale-110"
        aria-label={thread.starred ? "Unstar" : "Star"}
      >
        <Star
          className={`h-4 w-4 ${
            thread.starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
          }`}
        />
      </button>
    </div>
  );
}
