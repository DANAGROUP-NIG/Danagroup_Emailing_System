"use client";

// TODO: Implement MailThread Component
// Props: threadId: string
// - Fetches all messages in the thread via GET /api/mail/thread/:threadId
// - Renders all messages chronologically using MailMessage component
// - Shows thread subject as heading
// - Shows participant count and date range
// - Inline reply composer (ComposeModal in reply mode) pinned at bottom
// - Forward action on the last message
"use client";

import { useEffect, useState } from "react";
import MailMessage from "./MailMessage";
import Spinner from "@/components/ui/Spinner";

export default function MailThread({ threadId }: { threadId: string }) {
  const [threadData, setThreadData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadThread() {
      setLoading(true);
      try {
        // Fetches all messages in the thread
        const response = await fetch(`/api/mail/thread/${threadId}`);
        if (!response.ok) {
          // Handle 404 or other errors
          console.error("Thread not found");
        }
        const data = await response.json();
        setThreadData(data);
      } catch (error) {
        console.error("Failed to load email thread:", error);
      } finally {
        setLoading(false);
      }
    }

    if (threadId) loadThread();
  }, [threadId]);

  if (loading) return <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>;
  if (!threadData) return <div className="p-8 text-center text-muted-foreground">Thread not found.</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header Area */}
      <div className="p-6 border-b shrink-0">
        <h1 className="text-xl font-bold">{threadData.subject}</h1>
      </div>

      {/* Scrollable Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {threadData.messages.map((msg: any, index: number) => (
          <MailMessage 
            key={msg.id} 
            message={msg} 
            // Expand the last (most recent) message by default
            isCollapsed={index !== threadData.messages.length - 1} 
          />
        ))}
      </div>
    </div>
  );
}
