"use client";

import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { MailOpen, Trash2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

import { supportedMailFolders, useMail } from "@/hooks/useMail";
import { useMailStore } from "@/store/mailStore";
import type {
  DraftMessage,
  MailFolder,
  MailThreadSummary,
} from "@/types/mail.types";
import { htmlToText } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

interface MailListProps {
  viewMode: MailFolder;
  searchParams?: {
    page?: number;
    filter?: string;
  };
}

type MailListRow = {
  id: string;
  threadId: string | null;
  messageId?: string;
  isDraft: boolean;
  senderName: string;
  recipientSummary?: string;
  subject: string;
  bodyPreview: string;
  date?: string;
};

export default function MailList({ viewMode, searchParams }: MailListProps) {
  const router = useRouter();
  const params = useParams();
  const currentThreadId = params.threadId as string;
  const { openCompose } = useMailStore();
  const { selectedMessageIds, toggleMessageSelection, resetSelection } =
    useMailStore();
  const page = searchParams?.page || 1;

  const mailApi = useMail();
  const folderHooks = {
    inbox: mailApi.useInbox,
    sent: mailApi.useSent,
    drafts: mailApi.useDrafts,
    starred: mailApi.useStarred,
    trash: mailApi.useTrash,
  };
  const { mutate: markAsRead } = mailApi.useMarkRead();
  const deleteMail = mailApi.useDeleteMail();
  const isSupportedFolder = supportedMailFolders.includes(viewMode);
  const activeFolderQuery = isSupportedFolder
    ? folderHooks[viewMode as keyof typeof folderHooks](page)
    : { data: undefined, isLoading: false };

  const items = useMemo(
    () => normalizeMailRows(viewMode, activeFolderQuery.data),
    [activeFolderQuery.data, viewMode],
  );

  const toggleSelectAll = () => {
    if (selectedMessageIds.length === items.length) {
      resetSelection();
      return;
    }

    items.forEach((item) => {
      if (!selectedMessageIds.includes(item.id)) {
        toggleMessageSelection(item.id);
      }
    });
  };

  if (!isSupportedFolder) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <MailOpen className="h-10 w-10 text-slate-300" />
        <h3 className="text-sm font-semibold text-slate-900">
          Folder unavailable
        </h3>
        <p className="max-w-sm text-sm text-slate-500">
          This mailbox view is not backed by the current API yet.
        </p>
      </div>
    );
  }

  if (activeFolderQuery.isLoading) {
    return <MailListSkeleton />;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={
                items.length > 0 && selectedMessageIds.length === items.length
              }
              onChange={toggleSelectAll}
            />
            {selectedMessageIds.length > 0 ? (
              <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                <span className="mr-1 text-xs font-bold">
                  {selectedMessageIds.length}
                </span>
                <button
                  className="rounded p-1.5 text-destructive hover:bg-slate-100"
                  onClick={() => {
                    selectedMessageIds.forEach((id) => deleteMail.mutate(id));
                    resetSelection();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-bold capitalize text-foreground">
                  {viewMode}
                </h2>
                <p className="text-xs text-slate-500">
                  {items.length}{" "}
                  {items.length === 1 ? "conversation" : "conversations"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length > 0 ? (
          items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.isDraft) {
                  openCompose(item.id);
                  return;
                }

                if (item.messageId) {
                  markAsRead(item.messageId);
                }

                if (item.threadId) {
                  router.push(`/mail/${viewMode}/${item.threadId}`);
                }
              }}
              className={`mail-list-item w-full border-b p-4 text-left transition-colors hover:bg-slate-50 ${
                currentThreadId === item.threadId ? "bg-slate-100" : ""
              }`}
            >
              <div className="flex w-full items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedMessageIds.includes(item.id)}
                  onChange={() => toggleMessageSelection(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`truncate text-sm font-semibold ${
                        item.isDraft ? "text-dana-red-600" : "text-gray-900"
                      }`}
                    >
                      {item.senderName}
                    </div>
                    <div className="whitespace-nowrap text-[10px] text-muted-foreground">
                      {item.date
                        ? formatDistanceToNow(new Date(item.date), {
                            addSuffix: true,
                          })
                        : "No date"}
                    </div>
                  </div>
                  {item.recipientSummary ? (
                    <p className="truncate text-xs font-medium text-slate-500">
                      To: {item.recipientSummary}
                    </p>
                  ) : null}
                  <p className="truncate text-sm font-medium text-gray-800">
                    {item.subject}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.bodyPreview}
                  </p>
                </div>
              </div>
            </button>
          ))
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

function MailListSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-100 p-4"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="mt-1 h-4 w-4 rounded" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function normalizeMailRows(
  viewMode: MailFolder,
  payload: unknown,
): MailListRow[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown[] } | undefined)?.data)
      ? (payload as { data: unknown[] }).data
      : [];

  if (viewMode === "drafts") {
    return rows.map((item) => {
      const draft = item as DraftMessage;

      return {
        id: draft.id,
        threadId: draft.threadId ?? null,
        isDraft: true,
        senderName: "Draft",
        subject: draft.subject || "(No Subject)",
        bodyPreview: htmlToText(draft.bodyHtml) || draft.body || "(No content)",
        date: draft.createdAt,
      };
    });
  }

  return rows.map((item) => {
    const thread = item as MailThreadSummary;
    const latestMessage = thread.latestMessage;
    const sender = latestMessage?.sender;

    return {
      id: thread.id,
      threadId: latestMessage?.threadId ?? null,
      messageId: latestMessage?.id,
      isDraft: false,
      senderName:
        sender?.name ||
        [sender?.firstName, sender?.lastName].filter(Boolean).join(" ") ||
        sender?.email ||
        "Unknown sender",
      recipientSummary:
        viewMode === "sent"
          ? formatRecipientSummary(latestMessage?.recipients ?? [])
          : undefined,
      subject: thread.subject || "(No Subject)",
      bodyPreview:
        htmlToText(latestMessage?.bodyHtml) ||
        latestMessage?.body ||
        "(No content)",
      date: latestMessage?.createdAt,
    };
  });
}

function formatRecipientSummary(
  recipients: NonNullable<MailThreadSummary["latestMessage"]>["recipients"] = [],
) {
  const directRecipients = recipients.filter(
    (recipient) => recipient.type === "to",
  );
  const labels = directRecipients
    .map((recipient) => recipient.recipient?.name || recipient.recipient?.email)
    .filter((value): value is string => Boolean(value));

  if (labels.length === 0) {
    return "No recipients";
  }

  if (labels.length === 1) {
    return labels[0];
  }

  return `${labels[0]} +${labels.length - 1}`;
}
