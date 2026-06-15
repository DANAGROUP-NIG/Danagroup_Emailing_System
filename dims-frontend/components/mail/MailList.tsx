"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { MailOpen, RotateCcw, Star, Trash2 } from "lucide-react";
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
  messageId?: string | undefined;
  selectionId: string;
  isDraft: boolean;
  isStarred: boolean;
  isUnread: boolean;
  senderName: string;
  toSummary?: string | undefined;
  ccSummary?: string | undefined;
  bccSummary?: string | undefined;
  subject: string;
  bodyPreview: string;
  date?: string | undefined;
};

export default function MailList({ viewMode, searchParams }: MailListProps) {
  const router = useRouter();
  const params = useParams();
  const currentThreadId = params.threadId as string;
  const { openCompose } = useMailStore();
  const { selectedMessageIds, toggleMessageSelection, resetSelection } =
    useMailStore();
  const page = searchParams?.page || 1;
  const [starOverrides, setStarOverrides] = useState<Record<string, boolean>>(
    {},
  );

  const mailApi = useMail();
  const folderHooks = {
    inbox: mailApi.useInbox,
    sent: mailApi.useSent,
    drafts: mailApi.useDrafts,
    starred: mailApi.useStarred,
    trash: mailApi.useTrash,
  };
  const { mutate: markAsRead } = mailApi.useMarkRead();
  const starMail = mailApi.useStarMail();
  const deleteMail = mailApi.useDeleteMail();
  const restoreMail = mailApi.useRestoreMail();
  const permanentDeleteMail = mailApi.usePermanentDeleteMail();
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
      if (!selectedMessageIds.includes(item.selectionId)) {
        toggleMessageSelection(item.selectionId);
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
              aria-label="Select all messages"
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
                  aria-label={viewMode === "trash" ? "Permanently delete selected" : "Move selected to trash"}
                  className="rounded p-1.5 text-destructive hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    selectedMessageIds.forEach((id) => {
                      if (viewMode === "trash") {
                        permanentDeleteMail.mutate(id);
                        return;
                      }

                      deleteMail.mutate(id);
                    });
                    resetSelection();
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
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
            <div
              key={item.id}
              className={`mail-list-item w-full border-b p-4 text-left transition-colors hover:bg-slate-50 ${
                currentThreadId === item.threadId ? "bg-slate-100" : ""
              } ${item.isUnread ? "bg-blue-50/40" : ""}`}
            >
              <div className="flex w-full items-start gap-3">
                <input
                  type="checkbox"
                  aria-label={`Select message from ${item.senderName}`}
                  checked={selectedMessageIds.includes(item.selectionId)}
                  onChange={() => toggleMessageSelection(item.selectionId)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 h-4 w-4 rounded"
                />

                <button
                  type="button"
                  onClick={() => {
                    if (item.isDraft) {
                      openCompose(item.id);
                      return;
                    }

                    if (item.messageId && viewMode !== "trash") {
                      markAsRead(item.messageId);
                    }

                    if (item.threadId) {
                      router.push(`/mail/${viewMode}/${item.threadId}`);
                    }
                  }}
                  className="min-w-0 flex-1 text-left"
                >
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
                  <RecipientLine label="To" value={item.toSummary} />
                  <RecipientLine label="Cc" value={item.ccSummary} />
                  <RecipientLine label="Bcc" value={item.bccSummary} />
                  <p className="truncate text-sm font-medium text-gray-800">
                    {item.subject}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.bodyPreview}
                  </p>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  {viewMode === "inbox" || viewMode === "starred" ? (
                    <button
                      type="button"
                      disabled={!item.messageId}
                      onClick={() => {
                        if (!item.messageId) {
                          return;
                        }

                        const nextStarred = !(
                          starOverrides[item.messageId] ?? item.isStarred
                        );
                        setStarOverrides((current) => ({
                          ...current,
                          [item.messageId as string]: nextStarred,
                        }));
                        starMail.mutate({
                          id: item.messageId,
                          isStarred: nextStarred,
                        }, {
                          onError: () => {
                            setStarOverrides((current) => ({
                              ...current,
                              [item.messageId as string]: item.isStarred,
                            }));
                          },
                        });
                      }}
                      aria-label={
                        (item.messageId
                          ? (starOverrides[item.messageId] ?? item.isStarred)
                          : item.isStarred)
                          ? "Unstar message"
                          : "Star message"
                      }
                      aria-pressed={
                        item.messageId
                          ? (starOverrides[item.messageId] ?? item.isStarred)
                          : item.isStarred
                      }
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Star
                        aria-hidden="true"
                        className={`h-4 w-4 ${
                          item.messageId &&
                          (starOverrides[item.messageId] ?? item.isStarred)
                            ? "fill-amber-400 text-amber-400"
                            : ""
                        }`}
                      />
                    </button>
                  ) : null}

                  {viewMode === "trash" ? (
                    <button
                      type="button"
                      disabled={!item.messageId || restoreMail.isPending}
                      onClick={() => {
                        if (item.messageId) {
                          restoreMail.mutate(item.messageId);
                        }
                      }}
                      aria-label="Restore message from trash"
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-dana-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    disabled={
                      !item.messageId ||
                      deleteMail.isPending ||
                      permanentDeleteMail.isPending
                    }
                    onClick={() => {
                      if (!item.messageId) {
                        return;
                      }

                      if (viewMode === "trash") {
                        permanentDeleteMail.mutate(item.messageId);
                        return;
                      }

                      deleteMail.mutate(item.messageId);
                    }}
                    aria-label={viewMode === "trash" ? "Delete message forever" : "Move message to trash"}
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
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

function RecipientLine({ label, value }: { label: string; value?: string | undefined }) {
  if (!value) {
    return null;
  }

  return (
    <p className="truncate text-xs font-medium text-slate-500">
      {label}: {value}
    </p>
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
        messageId: draft.id,
        selectionId: draft.id,
        isDraft: true,
        isStarred: false,
        isUnread: false,
        senderName: "Draft",
        toSummary: formatRecipientSummary(draft.recipients ?? [], "to"),
        ccSummary: formatRecipientSummary(draft.recipients ?? [], "cc"),
        bccSummary: formatRecipientSummary(draft.recipients ?? [], "bcc"),
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
    const recipients = latestMessage?.recipients ?? [];
    const isStarred =
      thread.isStarred ||
      recipients.some((recipient) => recipient.isStarred === true);

    return {
      id: thread.id,
      threadId: latestMessage?.threadId ?? null,
      messageId: latestMessage?.id,
      selectionId: latestMessage?.id ?? thread.id,
      isDraft: false,
      isStarred,
      isUnread: (thread.unreadCount ?? 0) > 0,
      senderName:
        sender?.name ||
        [sender?.firstName, sender?.lastName].filter(Boolean).join(" ") ||
        sender?.email ||
        "Unknown sender",
      toSummary:
        viewMode === "sent"
          ? formatRecipientSummary(recipients, "to")
          : undefined,
      ccSummary:
        viewMode === "sent"
          ? formatRecipientSummary(recipients, "cc")
          : undefined,
      bccSummary:
        viewMode === "sent"
          ? formatRecipientSummary(recipients, "bcc")
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
  type: "to" | "cc" | "bcc" = "to",
): string | undefined {
  const directRecipients = recipients.filter(
    (recipient) => recipient.type === type,
  );
  const labels = directRecipients
    .map(
      (recipient) =>
        recipient.name ||
        recipient.email ||
        recipient.recipient?.name ||
        recipient.recipient?.email,
    )
    .filter((value): value is string => Boolean(value));

  if (labels.length === 0) {
    return undefined;
  }

  if (labels.length === 1) {
    return labels[0];
  }

  return `${labels[0]} +${labels.length - 1}`;
}
