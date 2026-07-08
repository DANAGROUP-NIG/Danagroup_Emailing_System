"use client";

import { ChevronDown, Lock } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/Dropdown";
import { Message, MessageRecipient } from "@/types/mail.types";

interface MessageDetailsDropdownProps {
  message: Message;
}

export default function MessageDetailsDropdown({
  message,
}: MessageDetailsDropdownProps) {
  const fromEmail =
    message.sender?.email || message.externalSenderEmail || "unknown@danagroup.internal";
  const fromName = message.sender?.name;
  const fromLabel = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  const to = formatRecipientList(message.recipients, "to");
  const cc = formatRecipientList(message.recipients, "cc");
  const bcc = formatRecipientList(message.recipients, "bcc");

  const date = format(
    new Date(message.sentAt || message.createdAt),
    "MMM d, yyyy, h:mm a",
  );

  const mailedBy = extractDomain(fromEmail);
  const signedBy = message.isInbound ? mailedBy : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Show message details"
          className="inline-flex items-center rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="w-[320px] p-3 text-sm"
      >
        <DetailRow label="from" value={fromLabel} />
        <DetailRow label="to" value={to || "me"} />
        {cc && <DetailRow label="cc" value={cc} />}
        {bcc && <DetailRow label="bcc" value={bcc} />}
        <DetailRow label="date" value={date} />
        <DetailRow label="subject" value={message.subject || "(No Subject)"} />
        {mailedBy && <DetailRow label="mailed-by" value={mailedBy} />}
        {signedBy && <DetailRow label="signed-by" value={signedBy} />}
        <div className="flex items-start gap-2 py-1">
          <span className="w-24 shrink-0 text-slate-500">security:</span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <Lock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            Standard encryption (TLS)
          </span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <span className="w-24 shrink-0 text-slate-500">{label}:</span>
      <span className="break-words text-slate-700">{value}</span>
    </div>
  );
}

function formatRecipientList(
  recipients: MessageRecipient[],
  type: "to" | "cc" | "bcc",
) {
  return recipients
    .filter((recipient) => recipient.type === type)
    .map((recipient) => recipient.email || recipient.recipient?.email)
    .filter((email): email is string => Boolean(email))
    .join(", ");
}

function extractDomain(email: string): string {
  const parts = email.split("@");
  return parts.length > 1 ? parts[parts.length - 1] : email;
}
