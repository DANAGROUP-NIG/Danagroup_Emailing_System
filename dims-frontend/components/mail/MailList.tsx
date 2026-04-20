"use client";

import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Archive, MailOpen, Trash2, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useMail } from "@/hooks/useMail"; // Path to your hook
import { useMailStore } from "@/store/mailStore"; // Path to your store
import type { InboxMessage, MailFolder, Message } from "@/types/mail.types";
import { htmlToText } from "@/lib/utils";

type MailFilter = "all" | "unread" | "starred";

interface MailListProps {
  viewMode: MailFolder;
  searchParams?: {
    page?: number;
    filter?: string;
  };
}

export default function MailList({ viewMode, searchParams }: MailListProps) {
  const router = useRouter();
  const params = useParams();
  const currentThreadId = params.threadId as string;
  const {openCompose} = useMailStore();

  // Get Data & Mutations from your Hook
  const mailApi = useMail();
  const folderHooks = {
    inbox: mailApi.useInbox,
    sent: mailApi.useSent,
    drafts: mailApi.useDrafts,
    trash: mailApi.useTrash,
  };

  const { mutate: markAsRead } = mailApi.useMarkRead();

  const page = searchParams?.page || 1;
  // 1. Get Global UI State from Zustand
  const { 
    selectedMessageIds, 
    toggleMessageSelection, 
    resetSelection 
  } = useMailStore();

  
  
  // Fetch real data (Page 1 for now)
  const { data, isLoading } = folderHooks[viewMode as keyof typeof folderHooks](page);
  const deleteMail = mailApi.useDeleteMail(""); // We'll pass IDs dynamically


  // Filtering Logic
  const threads = useMemo(() => {
  // Check if data.data exists (the array), otherwise check if data is the array
  if (Array.isArray(data)) return data;
    if (Array.isArray((data as any)?.data)) return (data as any).data;
    return [];
  }, [data]);
  
  const toggleSelectAll = () => {
    if (selectedMessageIds.length === threads.length) {
      resetSelection();
    } else {
      threads.forEach((t: any) => {
        if (!selectedMessageIds.includes(t.id)) toggleMessageSelection(t.id);
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }


  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header & Bulk Actions */}
      <div className="flex flex-col border-b p-4 gap-4 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={threads.length > 0 && selectedMessageIds.length === threads.length}
              onChange={toggleSelectAll}
            />
            {selectedMessageIds.length > 0 ? (
               <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                 <span className="text-xs font-bold mr-1">{selectedMessageIds.length}</span>
                 <button className="p-1.5 hover:bg-slate-100 rounded text-destructive" 
                   onClick={() => {
                     // Example: Delete first selected (or map to bulk delete if available)
                     selectedMessageIds.forEach(id => deleteMail.mutate());
                     resetSelection();
                   }}>
                   <Trash2 className="h-4 w-4" />
                 </button>
               </div>
            ) : (
              <h2 className="text-sm font-bold capitalize text-foreground">{viewMode}</h2>
            )}
          </div>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto">
        {threads.length > 0 ? (
          threads.map((item: any) => {
          //  Determine the data shape
          // Drafts: item is the message. Inbox/Sent: item is a thread with latestMessage.
          const isDraft = viewMode === 'drafts';
          const displayMessage = isDraft ? item : item.latestMessage;

          // 2. Safely resolve variables
          const id = item.id;
          const threadId = isDraft ? item.threadId : item.latestMessage?.threadId;
          const subject = item.subject || "(No Subject)";
          
          // Resolve sender name
          const senderName = isDraft 
            ? "Draft" 
            : `${displayMessage?.sender?.firstName ?? 'Unknown'} ${displayMessage?.sender?.lastName ?? ''}`;

          const date = displayMessage?.createdAt || item.createdAt;
          const bodyPreview = htmlToText(displayMessage?.bodyHtml) || displayMessage?.body || "(No content)";

          return (
            <button
              key={id}
              onClick={() => {
                if (isDraft) {
                  openCompose(id); // item.id is the message id
                  return;
                }
                
                // For non-drafts, mark read and navigate
                if (displayMessage?.id) markAsRead(displayMessage.id);
                if (threadId) router.push(`/mail/${viewMode}/${threadId}`);
              }}
              className={`mail-list-item w-full flex items-start text-left p-4 border-b hover:bg-slate-50 transition-colors ${
                currentThreadId === threadId ? "bg-slate-100" : ""
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <input
                  type="checkbox"
                  checked={selectedMessageIds.includes(id)}
                  onChange={() => toggleMessageSelection(id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`truncate text-sm font-semibold ${isDraft ? "text-dana-red-600" : "text-gray-900"}`}>
                      {senderName}
                    </div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : "No date"}
                    </div>
                  </div>
                  <p className="truncate text-sm font-medium text-gray-800">{subject}</p>
                  <p className="truncate text-xs text-muted-foreground">{bodyPreview}</p>
                </div>
              </div>
            </button>
          );
        })
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <MailOpen className="h-10 w-10 text-muted-foreground opacity-20" />
      <h3 className="mt-4 text-sm font-semibold">No messages found</h3>
    </div>
  );
}
