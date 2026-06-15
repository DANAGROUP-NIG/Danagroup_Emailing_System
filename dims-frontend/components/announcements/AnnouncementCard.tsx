'use client';

import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { Pin, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { Avatar, getInitials } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useToggleAnnouncementPin, useDeleteAnnouncement } from '@/hooks/useAnnouncements';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { Announcement } from '@/types/announcement.types';
import { cn } from '@/lib/utils';
import { sanitizeHtml, containsDangerousHtml } from '@/lib/sanitize';

interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit?: ((announcement: Announcement) => void) | undefined;
}

export default function AnnouncementCard({ announcement, onEdit }: AnnouncementCardProps) {
  const user = useAuthStore((state) => state.user);
  const togglePin = useToggleAnnouncementPin(announcement.id);
  const deleteAnnouncement = useDeleteAnnouncement();
  const [showMenu, setShowMenu] = useState(false);

  const isAuthorOrAdmin = user?.id === announcement.author.id || user?.role === 'group_admin' || user?.role === 'subsidiary_admin';
  const authorInitials = getInitials(announcement.author.firstName, announcement.author.lastName);
  const authorName = `${announcement.author.firstName} ${announcement.author.lastName}`;

  // Use strict sanitizer to prevent XSS attacks
  const sanitizedBody = sanitizeHtml(announcement.body);

  // Log warning if dangerous content was detected (development only)
  if (process.env.NODE_ENV !== 'production' && containsDangerousHtml(announcement.body)) {
    // eslint-disable-next-line no-console
    console.warn('[Security] Potentially dangerous HTML detected in announcement body and sanitized');
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      await deleteAnnouncement.mutateAsync(announcement.id);
    }
  };

  const handleTogglePin = async () => {
    await togglePin.mutateAsync();
  };

  return (
    <div
      className={cn(
        'border rounded-lg p-4 md:p-6 transition-all',
        announcement.isPinned
          ? 'bg-warning-light border-warning shadow-dana-sm'
          : 'bg-card border-border hover:shadow-dana-md'
      )}
    >
      {/* Header: Title + Pin Badge */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {announcement.isPinned && (
              <Badge variant="warning" size="sm">
                <Pin size={12} className="mr-1" />
                Pinned
              </Badge>
            )}
            <h3 className="text-lg font-semibold text-foreground">{announcement.title}</h3>
          </div>
        </div>

        {/* Actions Menu */}
        {isAuthorOrAdmin && (
          <DropdownMenu.Root open={showMenu} onOpenChange={setShowMenu}>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="sm" aria-label="Announcement actions" className="p-1">
                <MoreVertical size={18} aria-hidden="true" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" className="w-48 bg-card border border-border rounded-md shadow-dana-md p-1 z-50">
              <DropdownMenu.Item asChild>
                <button
                  onClick={handleTogglePin}
                  disabled={togglePin.isPending}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-primary/10 rounded transition-colors disabled:opacity-50"
                >
                  <Pin size={16} />
                  {announcement.isPinned ? 'Unpin' : 'Pin to top'}
                </button>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <button
                  onClick={() => {
                    onEdit?.(announcement);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-primary/10 rounded transition-colors"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <button
                  onClick={handleDelete}
                  disabled={deleteAnnouncement.isPending}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-light rounded transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        )}
      </div>

      {/* Target Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {announcement.target === 'subsidiary' && announcement.subsidiary && (
          <Badge variant="primary" size="sm">
            {announcement.subsidiary.name}
          </Badge>
        )}
        {announcement.target === 'department' && announcement.department && (
          <Badge variant="primary" size="sm">
            {announcement.department.name}
          </Badge>
        )}
        {announcement.target === 'all' && (
          <Badge variant="outline" size="sm">
            Company-wide
          </Badge>
        )}
      </div>

      {/* Body (HTML) */}
      <div
        className="text-foreground text-sm md:text-base mb-4 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizedBody }}
      />

      {/* Footer: Author + Date */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Avatar
            name={authorName}
            initials={authorInitials}
            avatarUrl={announcement.author.avatarUrl}
            size="sm"
          />
          <div className="text-xs">
            <p className="font-medium text-foreground">{authorName}</p>
            <p className="text-muted-foreground">
              {formatDistanceToNow(new Date(announcement.publishedAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
