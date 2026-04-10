// TODO: Implement MailList Component
// Props: viewMode: 'inbox' | 'sent' | 'drafts' | 'starred' | 'trash'
// - Paginated list of mail threads/messages
// - Renders a list of MailListItem components
// - Shows loading skeleton while fetching
// - Shows empty state when no messages
// - Bulk action toolbar: Mark as read, Delete, Archive (appears on selection)
// - Filter tabs: All, Unread, Starred (for inbox mode)

import { MailFolder } from "@/types/mail.types";
import { Suspense } from "react";

export default function MailList(viewMode: MailFolder , searchParams: { page?: number; filter?: string }) {
  // TODO: Implement
  return (
    <div className="flex flex-col h-full">
      <Suspense fallback={<MailListSkeleton />}>
        <MailListClient 
          viewMode={viewMode} 
          currentPage={searchParams.page || 1}
          filter={searchParams.filter || 'all'}
        />
      </Suspense>
    </div>
  );
}
