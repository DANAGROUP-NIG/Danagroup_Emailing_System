"use client";

import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { format } from "date-fns";
import { Download, Forward, Reply, Star, Trash2 } from "lucide-react";
import { useDeleteMail, useMarkRead, useStarMail } from "@/hooks/useMail";
import { filesApi } from "@/lib/api";
import { Message } from "@/types/mail.types";
import MessageDetailsDropdown from "./MessageDetailsDropdown";

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
  const isCollapsed = initialCollapsed;
  const markedReadIdsRef = useRef(new Set<string>());

  const myRecipient = message.recipients.find(
    (r) =>
      r.email?.toLowerCase() === user?.email?.toLowerCase() ||
      r.recipient?.email?.toLowerCase() === user?.email?.toLowerCase()
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

    if (canMarkRead && !markedReadIdsRef.current.has(message.id)) {
      markedReadIdsRef.current.add(message.id);
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
  const replyTo = buildReplyRecipients(message, user?.email);
  const replySubject = withSubjectPrefix(message.subject, "Re:");
  const forwardSubject = withSubjectPrefix(message.subject, "Fwd:");
  const originalText = formatOriginalMessageText(message.bodyHtml, message.body);
  const sentDate = format(new Date(message.sentAt || message.createdAt), "MMMM d, yyyy 'at' h:mm a");
  const senderLabel = `${fullName} <${senderEmail}>`;
  const replyBody = buildReplyBody(sentDate, senderLabel, originalText);
  const replyBodyHtml = buildReplyBodyHtml(sentDate, senderLabel, originalText);
  const forwardBody = buildForwardBody(sentDate, senderLabel, message.subject, toLine, originalText);
  const forwardBodyHtml = buildForwardBodyHtml(sentDate, senderLabel, message.subject, toLine, originalText);
  const handleReply = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    openCompose(null, {
      mode: "reply",
      threadId: message.threadId,
      to: replyTo,
      subject: replySubject,
      body: replyBody,
      bodyHtml: replyBodyHtml,
    });
  };

  const handleForward = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    openCompose(null, {
      mode: "forward",
      subject: forwardSubject,
      body: forwardBody,
      bodyHtml: forwardBodyHtml,
    });
  };

  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const avatarColor = stringToColor(senderEmail);

  return (
    <div className={`group relative overflow-hidden rounded-b-xl border shadow-sm transition-all min-h-full flex flex-col ${isUnread ? "border-l-4 border-l-blue-500" : "border-slate-200"}`}>
      {/* Message Header — Static Row Layout */}
      <div className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset flex justify-between items-center bg-white">
        <div className="flex items-center gap-3 px-5 py-3.5 transition-colors flex-1 min-w-0">
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
              <span className="text-gray-400 text-xs"> &lt;{message.sender?.email}&gt;</span>
              {isUnread && (
                <span className="shrink-0 h-2 w-2 rounded-full bg-blue-500" aria-label="Unread" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <span>To: {toLine || "me"}</span>
              <MessageDetailsDropdown message={message} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 px-5">
          <div className="flex">
            <span className="shrink-0 text-xs text-muted-foreground">
              {format(new Date(message.createdAt), "PPP p")}
            </span>
          </div>
          
          {/* Action buttons */}
          <div className="relative z-10 flex items-center gap-1 opacity-100 transition-opacity">
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

      {/* Body Content — Stretches to fill vertical height */}
      <div className="flex-1 overflow-y-auto bg-white">
        {/* Body Container */}
        <div className="px-[70px] py-3">
          <div
            className="prose prose-sm max-w-none text-slate-700
              prose-p:leading-relaxed prose-p:my-2
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-slate-800
              prose-ul:my-2 prose-li:my-0.5"
            dangerouslySetInnerHTML={{ __html: sanitizedBody }}
          />
        </div>

        {/* Attachments Section */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mx-16 mb-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Attachments ({message.attachments.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {message.attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-2 text-xs shadow-sm hover:border-slate-300 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      window.open(
                        filesApi.getStreamUrl(file.id),
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                    className="flex items-center gap-2 text-left hover:bg-slate-100 px-1 py-0.5 rounded transition-colors"
                  >
                    <span className="font-medium text-slate-700 truncate max-w-[150px]">{file.filename}</span>
                    <span className="text-slate-400">({(file.sizeBytes / 1024).toFixed(1)} KB)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = filesApi.getDownloadStreamUrl(file.id);
                      a.download = file.filename;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                    aria-label="Download attachment"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Action bar — Locks to the very bottom */}
      <div className="shrink-0 flex items-center gap-1.5 px-[70px] border-t border-slate-100 py-8">
        <button
          type="button"
          title="Reply"
          aria-label="Reply to message"
          onClick={handleReply}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs lg:text-base font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Reply className="h-4 w-4" aria-hidden="true" />
          Reply
        </button>
        <button
          type="button"
          title="Forward"
          aria-label="Forward message"
          onClick={handleForward}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs lg:text-base font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Forward className="h-4 w-4" aria-hidden="true" />
          Forward
        </button>
      </div>
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
    .trim()
    .split(/\r?\n/)
    .map((line) => (line.trim() ? `> ${line}` : ">"))
    .join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildReplyBody(sentDate: string, senderLabel: string, originalText: string) {
  const quotedOriginal = quoteText(originalText);

  return quotedOriginal
    ? `\n\nOn ${sentDate}, ${senderLabel} wrote:\n${quotedOriginal}`
    : `\n\nOn ${sentDate}, ${senderLabel} wrote:`;
}

function buildReplyBodyHtml(sentDate: string, senderLabel: string, originalText: string) {
  const quoted = escapeHtml(originalText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join("");

  return [
    "<p><br></p>",
    '<div class="dims-quoted-message dims-reply-quote">',
    `<p class="dims-quoted-meta">On ${escapeHtml(sentDate)}, ${escapeHtml(senderLabel)} wrote:</p>`,
    `<blockquote>${quoted || "<p>...</p>"}</blockquote>`,
    "</div>",
  ].join("");
}

function buildForwardBody(
  sentDate: string,
  senderLabel: string,
  subject: string | undefined,
  toLine: string,
  originalText: string,
) {
  return `\n\n---------- Forwarded message ---------\nFrom: ${senderLabel}\nDate: ${sentDate}\n${toLine ? `To: ${toLine}\n` : ""}Subject: ${subject || "(No Subject)"}\n\n${originalText}`;
}

function buildForwardBodyHtml(
  sentDate: string,
  senderLabel: string,
  subject: string | undefined,
  toLine: string,
  originalText: string,
) {
  const quoted = escapeHtml(originalText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join("");

  return [
    "<p><br></p>",
    '<div class="dims-quoted-message dims-forwarded-message">',
    '<p class="dims-quoted-meta">---------- Forwarded message ---------</p>',
    `<p>From: ${escapeHtml(senderLabel)}</p>`,
    `<p>Date: ${escapeHtml(sentDate)}</p>`,
    toLine ? `<p>To: ${escapeHtml(toLine)}</p>` : "",
    `<p>Subject: ${escapeHtml(subject || "(No Subject)")}</p>`,
    `<blockquote>${quoted || "<p>...</p>"}</blockquote>`,
    "</div>",
  ].join("");
}

function formatOriginalMessageText(
  bodyHtml?: string | null,
  body?: string | null,
) {
  return (htmlToText(bodyHtml) || htmlToText(body) || "").trim();
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
