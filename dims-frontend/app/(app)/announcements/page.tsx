'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AnnouncementFeed from '@/components/announcements/AnnouncementFeed';
import { AnnouncementComposer } from '@/components/announcements/AnnouncementComposer';
import { useAuthStore } from '@/store/authStore';
import type { Announcement } from '@/types/announcement.types';

export default function AnnouncementsPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>();
  
  // Check for announcement ID in URL (from notification deep link)
  const announcementId = searchParams.get('id');
  useEffect(() => {
    if (announcementId) {
      // Scroll to announcement with ID (handled by IntersectionObserver in feed)
      const element = document.getElementById(`announcement-${announcementId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [announcementId]);

  const canPost = user?.role === 'group_admin' || user?.role === 'subsidiary_admin' || user?.role === 'manager';

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsComposerOpen(true);
  };

  const handleCloseComposer = () => {
    setIsComposerOpen(false);
    setEditingAnnouncement(undefined);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Bell size={28} className="text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Company Announcements</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Stay updated with important company-wide and departmental announcements
          </p>
        </div>
        {canPost && (
          <Button
            onClick={() => {
              setEditingAnnouncement(undefined);
              setIsComposerOpen(true);
            }}
            variant="primary"
            className="whitespace-nowrap"
          >
            New Announcement
          </Button>
        )}
      </div>

      {/* Feed */}
      <AnnouncementFeed onEditAnnouncement={handleEditAnnouncement} />

      {/* Composer Modal */}
      {canPost && (
        <AnnouncementComposer
          isOpen={isComposerOpen}
          onClose={handleCloseComposer}
          announcement={editingAnnouncement}
        />
      )}
    </div>
  );
}
