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

import { useMail } from "@/hooks/useMail";
import MailMessage from "./MailMessage";

// Inside MailThread.tsx

export default function MailThread({ threadId }: { threadId: string }) {
  const { useThread } = useMail();
  const { data: threadData, isLoading, error } = useThread(threadId);

  if (isLoading) return <div className="p-8 text-center">Loading conversation...</div>;
  if (error || !threadData) return <div className="p-8 text-center text-destructive">Error loading thread.</div>;

  // 1. Correctly extract messages from the response
  const messages = threadData.messages || [];
  
  // 2. Extract the subject from the first message's thread object
  const subject = messages[0]?.subject || "No Subject";

  // console.log(messages)

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-50/30 p-4 lg:p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        
        {/* Thread Header */}
        <div className="mb-8 border-b pb-6">
          <h1 className="text-2xl font-bold text-foreground">{subject}</h1>
        </div>

        {/* Message List */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {messages.map((message, index:number) => {
            const isConsecutive = index > 0 && messages[index - 1].senderId === message.senderId;
            console.log(message);

            return(
            <MailMessage 
              key={message.id} 
              // Map your API data to the props expected by MailMessage
              message={message}
              isConsecutive={isConsecutive}

              // Automatically collapse all but the last message
              isCollapsed={index !== messages.length - 1} 
            />
          )}
        )}
        </div>
      </div>
    </div>
  );
}
