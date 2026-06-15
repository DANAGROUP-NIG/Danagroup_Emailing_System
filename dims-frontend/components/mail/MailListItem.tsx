'use client';

import { MailListMessage } from '@/types/mail.types';
import { Avatar, getInitials } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface MailListItemProps {
  thread: {
    id: string;
    subject: string;
    unreadCount: number;
    isStarred?: boolean;
    updatedAt?: string;
    latestMessage: MailListMessage | null;
  };
  isSelected?: boolean;
  onClick?: () => void;
  onStar?: (threadId: string, starred: boolean) => void;
}

export default function MailListItem({
  thread,
  isSelected,
  onClick,
  onStar,
}: MailListItemProps) {
  const sender = thread.latestMessage?.sender;
  const senderName = sender?.name || sender?.email || 'Unknown';
  const senderInitials = getInitials(sender?.firstName, sender?.lastName);
  const preview = thread.latestMessage?.body?.substring(0, 100) || '';
  const isUnread = thread.unreadCount > 0;
  const timestamp = thread.updatedAt
    ? formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })
    : '';

  return (
    <div
      onClick={onClick}
      className={cn(
        'mail-list-item flex cursor-pointer items-center gap-3 border-b border-input px-4 py-3 transition-colors hover:bg-gray-50',
        isSelected && 'selected bg-blue-50',
        isUnread && 'unread bg-white font-semibold'
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <Avatar
        name={senderName}
        initials={senderInitials}
        avatarUrl={sender?.avatarUrl ?? undefined}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn('truncate', isUnread ? 'font-semibold' : 'font-medium')}>
            {senderName}
          </span>
          <span className="text-xs text-gray-500 whitespace-nowrap">{timestamp}</span>
        </div>
        <p className="text-sm font-medium text-gray-900 truncate">{thread.subject}</p>
        <p className="text-xs text-gray-600 truncate">{preview}</p>
      </div>
      <div className="flex items-center gap-2">
        {isUnread && (
          <Badge variant="primary" size="sm">
            {thread.unreadCount}
          </Badge>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStar?.(thread.id, !thread.isStarred);
          }}
          className={cn(
            'p-1 rounded transition-colors',
            thread.isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'
          )}
          aria-label={thread.isStarred ? 'Unstar' : 'Star'}
        >
          <Star size={18} fill={thread.isStarred ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
}
