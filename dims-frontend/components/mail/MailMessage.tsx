"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { format } from "date-fns";
import { Reply, Forward, Star, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useDeleteMail, useMarkRead, useStarMail } from "@/hooks/useMail";
import { filesApi } from "@/lib/api";
import { Message } from "@/types/mail.types";

import { useAuthStore } from "@/store/authStore";
import { useMailStore } from "@/store/mailStore";
import { htmlToText } from "@/lib/utils";
import { sanitizeHtml, containsDangerousHtml } from "@/lib/sanitize";

export default function MailMessage({ 
  message, 
  isCollapsed: initialCollapsed = false,
}: { 
  message: Message; 
  isCollapsed?: boolean
}) {
  const { user } = useAuthStore();
  const { openCompose } = useMailStore();
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

  // Use strict sanitizer to prevent XSS attacks
  const rawBody = message.bodyHtml || message.body || "";
  const sanitizedBody = sanitizeHtml(rawBody);

  // Log warning if dangerous content was detected (development only)
  if (process.env.NODE_ENV !== "production" && containsDangerousHtml(rawBody)) {
    // eslint-disable-next-line no-console
    console.warn("[Security] Potentially dangerous HTML detected in email body and sanitized");
  }
  
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
  const messageDate = new Date(message.createdAt);
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

  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const avatarColor = stringToColor(senderEmail);

  return (
    <div className={`group rounded-xl border bg-white shadow-sm overflow-hidden transition-all ${isUnread && isCollapsed ? "border-l-4 border-l-blue-500" : "border-slate-200"}`}>
      {/* Message Header — always visible */}
      <button
        type="button"
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? `Expand message from ${fullName}` : `Collapse message from ${fullName}`}
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <div className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${isCollapsed ? "hover:bg-slate-50" : "border-b border-slate-100 bg-slate-50/60"}`}>
          {/* Avatar */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: avatarColor }}
            aria-hidden="true"
          >
            {initials || "?"}
          </div>

          {/* Sender info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`truncate text-sm ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                {fullName}
              </span>
              {isUnread && (
                <span className="shrink-0 h-2 w-2 rounded-full bg-blue-500" aria-label="Unread" />
              )}
            </div>
            {isCollapsed ? (
              <span className="block truncate text-xs text-slate-400 mt-0.5">
                {htmlToText(message.bodyHtml) || message.body || "(No content)"}
              </span>
            ) : (
              <span className="block text-xs text-slate-400 mt-0.5">
                To: {toLine || "me"}
              </span>
            )}
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
      </button>

      {/* Expanded body */}
      {!isCollapsed && (
        <div className="px-11 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="mb-6 flex flex-col text-xs text-muted-foreground">
            <span>From: <b className="text-foreground">{fullName}</b> &lt;{senderEmail}&gt;</span>
            {toLine ? <span>To: {toLine}</span> : null}
            {ccLine ? <span>Cc: {ccLine}</span> : null}
            {bccLine ? <span>Bcc: {bccLine}</span> : null}
            <span>Date: {format(new Date(message.createdAt), "PPPP 'at' p")}</span>
          </div>

          {/* Body */}
          <div className="px-5 py-5">
            <div
              className="prose prose-sm max-w-none text-slate-700
                prose-p:leading-relaxed prose-p:my-2
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-slate-800
                prose-ul:my-2 prose-li:my-0.5"
              dangerouslySetInnerHTML={{ __html: sanitizedBody }}
            />
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mx-5 mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Attachments ({message.attachments.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={async () => {
                      const response = await filesApi.getDownloadUrl(file.id);
                      const url = response?.data?.data?.url;
                      if (url) {
                        window.open(url, "_blank", "noopener,noreferrer");
                      }
                    }}
                    className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs shadow-sm hover:bg-slate-100 hover:border-slate-300 transition-colors"
                  >
                    <span className="font-medium text-slate-700 truncate max-w-[150px]">{file.filename}</span>
                    <span className="text-slate-400">({(file.sizeBytes / 1024).toFixed(1)} KB)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-1.5 border-t border-slate-100 bg-slate-50/50 px-5 py-2.5">
            <button
              type="button"
              title="Reply"
              aria-label="Reply to message"
              onClick={handleReply}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Reply className="h-3.5 w-3.5" aria-hidden="true" />
              Reply
            </button>
            <button
              type="button"
              title="Forward"
              aria-label="Forward message"
              onClick={handleForward}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Forward className="h-3.5 w-3.5" aria-hidden="true" />
              Forward
            </button>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                disabled={!myRecipient || starMail.isPending}
                title={myRecipient ? (myRecipient.isStarred ? "Unstar" : "Star") : "Star"}
                aria-label={myRecipient ? (myRecipient.isStarred ? "Unstar message" : "Star message") : "Only recipient messages can be starred"}
                aria-pressed={myRecipient?.isStarred === true}
                onClick={() => {
                  if (!myRecipient) return;
                  starMail.mutate({ id: message.id, isStarred: !myRecipient.isStarred });
                }}
                className={`rounded-md p-1.5 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${myRecipient?.isStarred === true ? "text-amber-400" : "text-slate-400 hover:text-amber-400"}`}
              >
                <Star className={`h-4 w-4 ${myRecipient?.isStarred === true ? "fill-current" : ""}`} aria-hidden="true" />
              </button>
              <button
                type="button"
                title="Delete"
                aria-label="Move message to trash"
                disabled={deleteMail.isPending}
                onClick={() => deleteMail.mutate(message.id)}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed hover actions */}
      {isCollapsed && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden items-center gap-1 group-hover:flex">
          <button
            type="button"
            title="Reply"
            aria-label="Reply to message"
            onClick={(e) => { e.stopPropagation(); handleReply(e); }}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Reply className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            title="Delete"
            aria-label="Move message to trash"
            disabled={deleteMail.isPending}
            onClick={(e) => { e.stopPropagation(); deleteMail.mutate(message.id); }}
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
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

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 52%, 42%)`;
}

function formatRecipients(
  recipients: Message["recipients"],
  type: "to" | "cc" | "bcc",
) {
  const labels = recipients
    .filter((recipient) => recipient.type === type)
    .map(
      (recipient) =>
        recipient.email ||
        recipient.recipient?.email,
    )
    .filter(Boolean);

  return labels.join(", ");
}
