// TODO: Implement Sent Mail Page
// - List of messages sent by the current user
// - Uses MailList component with 'sent' view mode
// - Paginated with TanStack Query

"use client";

import MailList from "@/components/mail/MailList"; 
import { useSearchParams } from "next/navigation";

export default function SentPage() {
  const searchParams = useSearchParams();
  
  // Extract the page from the URL or default to 1
  const currentPage = Number(searchParams.get("page")) || 1;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MailList 
        viewMode="sent" 
        searchParams={{ page: currentPage }} 
      />
    </div>
  );
}

