"use client";

import { memo, useMemo, useState } from "react";
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


// TODO: Implement MailMessage Component
// Props: message: Message, isCollapsed?: boolean
// - Renders a single message within a thread
// - Collapsed state: shows sender, snippet, and date
// - Expanded state: shows full sender info, formatted date, HTML body
// - HTML body rendered via dangerouslySetInnerHTML (sanitized with DOMPurify)
// - Attachment list shown below body (AttachmentList component)
// - Action buttons: Reply, Forward, Star, Delete (shown on hover)
// - Marks message as read on expand (PATCH /api/mail/:id/read)

function MailMessage({ 
  message, 
  isCollapsed: initialCollapsed = false,
  isConsecutive = false,
}: { 
  message: Message; 
  isCollapsed?: boolean
  isConsecutive?: boolean
}) {
  const { user } = useAuthStore();
  const openReply = useMailStore((state) => state.openReply);
  const openForward = useMailStore((state) => state.openForward);
  const { useDeleteMail, useStarMail } = useMail();
  const starMail = useStarMail();
  const deleteMail = useDeleteMail();
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const myRecipient = message.recipients.find(
    (r) => r.email === user?.email || r.recipient?.email === user?.email
  );
  const isUnread = myRecipient?.isRead === false;

  const sanitizedBody = useMemo(
    () => DOMPurify.sanitize(message.bodyHtml || message.body),
    [message.body, message.bodyHtml],
  );
  
  const fullName = message.sender?.name || message.sender?.email || "Unknown sender";
  const senderEmail = message.sender?.email || "unknown@danagroup.internal";
  const toLine = formatRecipients(message.recipients, "to");
  const ccLine = formatRecipients(message.recipients, "cc");
  const bccLine = formatRecipients(message.recipients, "bcc");
  const replyDefaults = useMemo(
    () => buildReplyDefaults(message, user?.email),
    [message, user?.email],
  );
  const forwardDefaults = useMemo(
    () => buildForwardDefaults(message),
    [message],
  );
  const handleReply = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    openReply(replyDefaults);
  };
  const handleForward = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    openForward(forwardDefaults);
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
          <div className="relative z-20 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              className="rounded p-1.5 hover:bg-muted focus:bg-muted focus:outline-none focus:ring-2 focus:ring-dana-blue-300"
              title="Reply"
              aria-label="Reply"
              onClick={handleReply}
            >
              <Reply className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded p-1.5 hover:bg-muted focus:bg-muted focus:outline-none focus:ring-2 focus:ring-dana-blue-300"
              title="Forward"
              aria-label="Forward"
              onClick={handleForward}
            >
              <Forward className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={!myRecipient || starMail.isPending}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
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
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                deleteMail.mutate(message.id);
              }}
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

export default memo(MailMessage);

function normalizeSubjectForReply(subject: string) {
  const trimmed = subject?.trim() || "(No Subject)";
  return /^re:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

function normalizeSubjectForForward(subject: string) {
  const trimmed = subject?.trim() || "(No Subject)";
  return /^fwd?:/i.test(trimmed) ? trimmed : `Fwd: ${trimmed}`;
}

function uniqueEmails(emails: string[], currentUserEmail?: string) {
  const current = currentUserEmail?.toLowerCase();
  const seen = new Set<string>();

  return emails
    .map((email) => email.trim().toLowerCase())
    .filter((email) => {
      if (!email || email === current || seen.has(email)) {
        return false;
      }

      seen.add(email);
      return true;
    });
}

function recipientEmail(recipient: Message["recipients"][number]) {
  return recipient.email || recipient.recipient?.email || "";
}

function buildReplyDefaults(message: Message, currentUserEmail?: string) {
  const senderEmail = message.sender?.email || "";
  const toRecipients = message.recipients
    .filter((recipient) => recipient.type === "to")
    .map(recipientEmail);
  const ccRecipients = message.recipients
    .filter((recipient) => recipient.type === "cc")
    .map(recipientEmail);

  const toEmails =
    senderEmail.toLowerCase() === currentUserEmail?.toLowerCase()
      ? uniqueEmails(toRecipients, currentUserEmail)
      : uniqueEmails([senderEmail], currentUserEmail);

  const ccEmails = uniqueEmails(
    [...ccRecipients, ...toRecipients.filter((email) => !toEmails.includes(email.toLowerCase()))],
    currentUserEmail,
  );

  const originalBody = htmlToText(message.bodyHtml) || message.body || "";
  const quotedBody = originalBody
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  const senderLabel = message.sender?.name || senderEmail || "the sender";
  const createdAt = message.createdAt
    ? format(new Date(message.createdAt), "PP p")
    : "an earlier date";

  return {
    mode: "reply" as const,
    threadId: message.threadId,
    to: toEmails.join(", "),
    cc: ccEmails.join(", "),
    subject: normalizeSubjectForReply(message.subject),
    body: `\n\nOn ${createdAt}, ${senderLabel} wrote:\n${quotedBody}`,
  };
}

function buildForwardDefaults(message: Message) {
  const senderEmail = message.sender?.email || "";
  const senderLabel = message.sender?.name || senderEmail || "Unknown sender";
  const createdAt = message.createdAt
    ? format(new Date(message.createdAt), "PPPP 'at' p")
    : "an earlier date";
  const toLine = formatRecipients(message.recipients, "to") || "(undisclosed)";
  const ccLine = formatRecipients(message.recipients, "cc");
  const originalBody = htmlToText(message.bodyHtml) || message.body || "";
  const attachmentSummary = message.attachments?.length
    ? `\nAttachments on original message: ${message.attachments
        .map((attachment) => attachment.filename)
        .join(", ")}\n`
    : "";

  return {
    mode: "forward" as const,
    subject: normalizeSubjectForForward(message.subject),
    body: [
      "",
      "",
      "---------- Forwarded message ---------",
      `From: ${senderLabel} <${senderEmail}>`,
      `Date: ${createdAt}`,
      `Subject: ${message.subject || "(No Subject)"}`,
      `To: ${toLine}`,
      ccLine ? `Cc: ${ccLine}` : null,
      attachmentSummary.trim() || null,
      "",
      originalBody,
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  };
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
