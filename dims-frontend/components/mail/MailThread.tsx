"use client";

import { useDeleteMail, useMarkUnread, useThread } from "@/hooks/useMail";
import { Skeleton } from "@/components/ui/Skeleton";
import MailMessage from "./MailMessage";
import {
  Archive,
  ArrowLeft,
  FolderInput,
  Mail,
  MailOpen,
  MoreVertical,
  OctagonAlert,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MailFolder } from "@/types/mail.types";

export default function MailThread({
  threadId,
  viewMode,
}: {
  threadId: string;
  viewMode: MailFolder;
}) {
  const router = useRouter();
  const { data: threadData, isLoading, error } = useThread(threadId);
  const deleteMail = useDeleteMail();
  const markUnread = useMarkUnread();

  if (isLoading) return <MailThreadSkeleton />;
  if (error || !threadData) return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Mail className="mx-auto h-10 w-10 text-destructive/40 mb-3" />
        <p className="text-sm text-destructive">Error loading thread.</p>
      </div>
    </div>
  );

  const messages = threadData.messages || [];
  const subject = messages[0]?.subject || "No Subject";
  const messageCount = messages.length;
  const actionMessageId = [...messages].reverse().find((message) => !message.isDraft)?.id;
  const canUseMessageActions = Boolean(actionMessageId);

  return (
    <div data-testid="thread-view" className="flex h-full flex-col bg-slate-50">
      {/* Sticky subject header */}
      <div className="shrink-0 border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="mx-auto flex items-start gap-3">
          <Link
            href={`/mail/${viewMode}`}
            aria-label={`Back to ${viewMode}`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1 self-center">
            <h1 className="truncate text-lg lg:text-2xl leading-snug tracking-wide text-slate-800">
              {subject}
            </h1>
            {messageCount > 1 && (
              <p className="mt-0.5 text-xs text-slate-500">{messageCount} messages in this thread</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ToolbarButton
              icon={Archive}
              label="Archive"
              disabled
              title="Archive is not available from the current mail API yet"
            />
            <ToolbarButton
              icon={OctagonAlert}
              label="Report spam"
              disabled
              title="Spam reporting is not available from the current mail API yet"
            />
            <ToolbarButton
              icon={Trash2}
              label="Delete"
              disabled={!canUseMessageActions || deleteMail.isPending}
              onClick={() => {
                if (!actionMessageId) {
                  return;
                }

                deleteMail.mutate(actionMessageId, {
                  onSuccess: () => router.push(`/mail/${viewMode}`),
                });
              }}
            />
            <ToolbarButton
              icon={MailOpen}
              label="Mark as unread"
              disabled={!canUseMessageActions || markUnread.isPending}
              onClick={() => {
                if (actionMessageId) {
                  markUnread.mutate(actionMessageId);
                }
              }}
            />
            <ToolbarButton
              icon={FolderInput}
              label="Move to"
              disabled
              title="Move to folder is not available from the current mail API yet"
            />
            <ToolbarButton
              icon={MoreVertical}
              label="More"
              disabled
              title="More actions are not available from the current mail API yet"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="mx-auto min-w-full flex-1 flex-col space-y-4 ">
          {messages.map((message) => (
            <MailMessage
              key={message.id}
              message={message}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  disabled,
  title,
  onClick,
}: {
  icon: typeof Archive;
  label: string;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title ?? label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}


function MailThreadSkeleton() {
  return (
    <div className="flex h-full flex-col bg-[#f5f6fa]">
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-3xl space-y-2">
          <Skeleton className="h-6 w-80" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-5 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-3 w-20 shrink-0" />
              </div>
              <div className="px-5 py-5 space-y-2.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[92%]" />
                <Skeleton className="h-4 w-[80%]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
