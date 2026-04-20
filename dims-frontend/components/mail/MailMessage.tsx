"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Reply, Forward, Star, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { useMail } from "@/hooks/useMail";
import { InboxMessage, Message } from "@/types/mail.types";

import { useAuthStore } from "@/store/authStore";
import { htmlToText } from "@/lib/utils";


// TODO: Implement MailMessage Component
// Props: message: Message, isCollapsed?: boolean
// - Renders a single message within a thread
// - Collapsed state: shows sender, snippet, and date
// - Expanded state: shows full sender info, formatted date, HTML body
// - HTML body rendered via dangerouslySetInnerHTML (sanitized with DOMPurify)
// - Attachment list shown below body (AttachmentList component)
// - Action buttons: Reply, Forward, Star, Delete (shown on hover)
// - Marks message as read on expand (PATCH /api/mail/:id/read)

interface Attachment {
  id: string;
  name: string;
  size: number;
  url: string;
}

export default function MailMessage({ 
  message, 
  isCollapsed: initialCollapsed = false,
  isConsecutive = false,
}: { 
  message: Message; 
  isCollapsed?: boolean
  isConsecutive?: boolean
}) {
  const { user } = useAuthStore();
  const { useMarkRead } = useMail();
  const markRead = useMarkRead(); 
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const myRecipient = message.recipients.find(
  (r) => r.recipient.email === user?.email
);
  // Marks message as read on expand (PATCH /api/mail/:id/read)
  useEffect(() => {
    const canMarkRead = 
      !isCollapsed && 
      message.id && 
      !message.is_draft && 
      message.senderId !== user?.id && 
      myRecipient && 
      myRecipient.is_read === false;

    if (canMarkRead) {
      // Pass the message.id to the mutation
      markRead.mutate(message.id);
    }
  }, [isCollapsed, message.id, myRecipient?.is_read]);

  //console.log(message)

  const isUnread = myRecipient?.is_read === false;

  const sanitizedBody = DOMPurify.sanitize(message.bodyHtml || message.body);
  

  const fullName = message.sender.firstName + " " + message.sender.lastName

  return (
    <div className={`group border-b border-border bg-background transition-all ${!isCollapsed ? "pb-6" : ""}`}>
      {/* Header / Collapsed View */}
      <div 
        
        className="flex items-center justify-between p-4 hover:bg-muted/30"
      >
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex cursor-pointer  min-w-0 items-center gap-3">
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          
          <div className="flex flex-col min-w-0">
            <span className={`truncate text-sm ${isUnread ? "font-bold" : "font-medium"}`}>
              {fullName}
            </span>
            {isCollapsed && (
              <span className="truncate text-xs text-muted-foreground">
                {htmlToText(message.bodyHtml) || message.body}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="shrink-0 text-xs text-muted-foreground">
            {isCollapsed 
              ? format(new Date(message.createdAt), "MMM d") 
              : format(new Date(message.createdAt), "PPP p")}
          </span>
          
          {/* Action buttons: Reply, Forward, Star, Delete (shown on hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-[]">
            <button className="p-1.5 hover:bg-muted rounded" title="Reply"><Reply className="h-4 w-4" /></button>
            <button className="p-1.5 hover:bg-muted rounded" title="Forward"><Forward className="h-4 w-4" /></button>
            <button className={`p-1.5 hover:bg-muted rounded ${myRecipient?.is_starred === true ? "text-amber-400" : ""}`} title="Star">
              <Star className={`h-4 w-4 ${myRecipient?.is_starred === true ? "fill-current" : ""}`} />
            </button>
            <button className="p-1.5 hover:bg-muted rounded text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {/* Expanded state: shows full sender info, formatted date, HTML body */}
      {!isCollapsed && (
        <div className="px-11 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="mb-6 flex flex-col text-xs text-muted-foreground">
            <span>From: <b className="text-foreground">{fullName}</b> &lt;{message.sender.email}&gt;</span>
            <span>Date: {format(new Date(message.createdAt), "PPPP 'at' p")}</span>
          </div>

          {/* HTML body rendered via dangerouslySetInnerHTML (sanitized with DOMPurify) */}
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizedBody }} 
          />

          {/* Attachment list shown below body (AttachmentList component placeholder) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-8 pt-4 border-t">
              <p className="text-xs font-semibold mb-2">Attachments ({message.attachments.length})</p>
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((file) => (
                  <div key={file.id} className="flex items-center gap-2 rounded-md border p-2 text-xs hover:bg-muted cursor-pointer">
                    <span className="font-medium truncate max-w-[150px]">{file.filename}</span>
                    <span className="text-muted-foreground">({(file.sizeBytes / 1024).toFixed(1)} KB)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

