// TODO: Implement Inbox Page
// - Two-panel layout (Gmail-style)
// - Left panel: paginated list of mail threads (MailList component)
// - Right panel: thread view on click (MailThread component)
// - Filter tabs: All, Unread, Starred
// - Bulk actions: Mark as read, Delete, Archive
// - Uses useQuery(['mail', 'inbox']) via useMail hook

import MailList from "@/components/mail/MailList";

export default function InboxPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Inbox</h1>
      {/* Pass a "folder" prop to filter the data inside the component */}
      <MailList viewMode="inbox" />
    </div>
  );
}
