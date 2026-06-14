"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { format } from "date-fns";
import { Reply, Forward, Star, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { useMail } from "@/hooks/useMail";
import { filesApi } from "@/lib/api";
import { Message } from "@/types/mail.types";

import { useAuthStore } from "@/store/authStore";
import { useMailStore } from "@/store/mailStore";
import { htmlToText } from "@/lib/utils";

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
  const { openCompose } = useMailStore();
  const { useDeleteMail, useMarkRead, useStarMail } = useMail();
  const markRead = useMarkRead(); 
  const starMail = useStarMail();
  const deleteMail = useDeleteMail();
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const myRecipient = message.recipients.find(
    (r) => r.email === user?.email || r.recipient?.email === user?.email
  );
  // Marks message as read on expand (PATCH /api/mail/:id/read)
  useEffect(() => {
    const canMarkRead = 
      !isCollapsed && 
      message.id && 
      !message.isDraft && 
      message.sender?.id !== user?.id && 
      myRecipient && 
      myRecipient.isRead === false;

    if (canMarkRead) {
      // Pass the message.id to the mutation
      markRead.mutate(message.id);
    }
  }, [isCollapsed, markRead, message.id, message.isDraft, message.sender?.id, myRecipient, user?.id]);

  const isUnread = myRecipient?.isRead === false;

  const sanitizedBody = DOMPurify.sanitize(message.bodyHtml || message.body);
  
  const fullName = message.sender?.name || message.sender?.email || "Unknown sender";
  const senderEmail = message.sender?.email || "unknown@danagroup.internal";
  const toLine = formatRecipients(message.recipients, "to");
  const ccLine = formatRecipients(message.recipients, "cc");
  const bccLine = formatRecipients(message.recipients, "bcc");
  const replyTo = buildReplyRecipients(message, user?.email);
  const replySubject = withSubjectPrefix(message.subject, "Re:");
  const forwardSubject = withSubjectPrefix(message.subject, "Fwd:");
  const originalText = htmlToText(message.bodyHtml) || message.body || "";
  const sentDate = format(new Date(message.createdAt), "PPP p");
  const senderLabel = `${fullName} <${senderEmail}>`;
  const replyBody = `\n\nOn ${sentDate}, ${senderLabel} wrote:\n${quoteText(originalText)}`;
  const forwardBody = `\n\n---------- Forwarded message ---------\nFrom: ${senderLabel}\nDate: ${sentDate}\nSubject: ${message.subject || "(No Subject)"}${toLine ? `\nTo: ${toLine}` : ""}\n\n${originalText}`;
  const handleReply = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    openCompose(null, {
      mode: "reply",
      threadId: message.threadId,
      to: replyTo,
      subject: replySubject,
      body: replyBody,
    });
  };

  const handleForward = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    openCompose(null, {
      mode: "forward",
      subject: forwardSubject,
      body: forwardBody,
    });
  };

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
          <div className="relative z-10 flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <button
              type="button"
              className="p-1.5 hover:bg-muted rounded"
              title="Reply"
              onClick={handleReply}
            >
              <Reply className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1.5 hover:bg-muted rounded"
              title="Forward"
              onClick={handleForward}
            >
              <Forward className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={!myRecipient || starMail.isPending}
              onClick={() => {
                if (!myRecipient) return;

                starMail.mutate({
                  id: message.id,
                  isStarred: !myRecipient.isStarred,
                });
              }}
              className={`p-1.5 hover:bg-muted rounded disabled:cursor-not-allowed disabled:opacity-50 ${myRecipient?.isStarred === true ? "text-amber-400" : ""}`}
              title={myRecipient ? (myRecipient.isStarred ? "Unstar" : "Star") : "Only recipient messages can be starred"}
            >
              <Star className={`h-4 w-4 ${myRecipient?.isStarred === true ? "fill-current" : ""}`} />
            </button>
            <button
              type="button"
              disabled={deleteMail.isPending}
              onClick={() => deleteMail.mutate(message.id)}
              className="p-1.5 hover:bg-muted rounded text-destructive disabled:cursor-not-allowed disabled:opacity-50"
              title="Move to trash"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded state: shows full sender info, formatted date, HTML body */}
      {!isCollapsed && (
        <div className="px-11 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="mb-6 flex flex-col text-xs text-muted-foreground">
            <span>From: <b className="text-foreground">{fullName}</b> &lt;{senderEmail}&gt;</span>
            {toLine ? <span>To: {toLine}</span> : null}
            {ccLine ? <span>Cc: {ccLine}</span> : null}
            {bccLine ? <span>Bcc: {bccLine}</span> : null}
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
                  <button
                    key={file.id}
                    type="button"
                    onClick={async () => {
                      const response = await filesApi.getDownloadUrl(file.id);
                      if (response?.url) {
                        window.open(response.url, "_blank", "noopener,noreferrer");
                      }
                    }}
                    className="flex items-center gap-2 rounded-md border p-2 text-left text-xs hover:bg-muted"
                  >
                    <span className="font-medium truncate max-w-[150px]">{file.filename}</span>
                    <span className="text-muted-foreground">({(file.sizeBytes / 1024).toFixed(1)} KB)</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function withSubjectPrefix(subject: string | undefined, prefix: "Re:" | "Fwd:") {
  const normalizedSubject = subject?.trim() || "(No Subject)";
  return normalizedSubject.toLowerCase().startsWith(prefix.toLowerCase())
    ? normalizedSubject
    : `${prefix} ${normalizedSubject}`;
}

function quoteText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
}

function buildReplyRecipients(message: Message, currentUserEmail?: string) {
  const currentEmail = currentUserEmail?.toLowerCase();
  const senderEmail = message.sender?.email?.toLowerCase();

  if (senderEmail && senderEmail !== currentEmail) {
    return senderEmail;
  }

  return message.recipients
    .filter((recipient) => recipient.type === "to" || recipient.type === "cc")
    .map((recipient) => recipient.email || recipient.recipient?.email)
    .filter((email): email is string => Boolean(email))
    .map((email) => email.toLowerCase())
    .filter((email, index, emails) => email !== currentEmail && emails.indexOf(email) === index)
    .join(", ");
}

function formatRecipients(
  recipients: Message["recipients"],
  type: "to" | "cc" | "bcc",
) {
  const labels = recipients
    .filter((recipient) => recipient.type === type)
    .map(
      (recipient) =>
        recipient.name ||
        recipient.email ||
        recipient.recipient?.name ||
        recipient.recipient?.email,
    )
    .filter(Boolean);

  return labels.join(", ");
}
