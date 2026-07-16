"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import {
  Bell,
  Megaphone,
  MailOpen,
  RotateCcw,
  Star,
  Trash2,
  Users,
  PanelRight,
  PanelBottom,
  Square
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

import { useUIStore } from "@/store/uiStore";

import {
  supportedMailFolders,
  useInbox,
  useSent,
  useDrafts,
  useStarred,
  useTrash,
  useDeleteDraft,
  useMarkRead,
  useStarThread,
  useDeleteMail,
  useRestoreMail,
  usePermanentDeleteMail,
} from "@/hooks/useMail";
import { useMailStore } from "@/store/mailStore";
import type {
  DraftMessage,
  MailFolder,
  MailThreadSummary,
  SenderSummary,
} from "@/types/mail.types";
import { htmlToText } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { getInitials } from "../ui/Avatar";

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

type InboxCategory = "primary" | "promotions" | "social" | "updates";

const inboxCategories: Array<{
  id: InboxCategory;
  label: string;
  icon: typeof MailOpen;
}> = [
  { id: "primary", label: "Primary", icon: MailOpen },
  { id: "promotions", label: "Promotions", icon: Megaphone },
  { id: "social", label: "Socials", icon: Users },
  { id: "updates", label: "Updates", icon: Bell },
];

export default function MailList({ viewMode }: MailListProps) {
  const router = useRouter();
  const params = useParams();

  const splitPaneMode = useUIStore((s) => s.splitPaneMode);
  const setSplitPaneMode = useUIStore((s) => s.setSplitPaneMode);

  const currentThreadId = params.threadId as string;
  const { openCompose } = useMailStore();
  const { selectedMessageIds, toggleMessageSelection, resetSelection } =
    useMailStore();
  const [starOverrides, setStarOverrides] = useState<Record<string, boolean>>(
    {},
  );
  const [activeInboxCategory, setActiveInboxCategory] =
    useState<InboxCategory>("primary");

  const inboxQuery = useInbox();
  const sentQuery = useSent();
  const draftsQuery = useDrafts();
  const starredQuery = useStarred();
  const trashQuery = useTrash();

  const folderQueries = {
    inbox: inboxQuery,
    sent: sentQuery,
    drafts: draftsQuery,
    starred: starredQuery,
    trash: trashQuery,
  };

  const { mutate: markAsRead } = useMarkRead();
  const starThread = useStarThread();
  const deleteMail = useDeleteMail();
  const restoreMail = useRestoreMail();
  const permanentDeleteMail = usePermanentDeleteMail();
  const deleteDraft = useDeleteDraft();
  const isSupportedFolder = supportedMailFolders.includes(viewMode);
  const activeFolderQuery = isSupportedFolder
    ? folderQueries[viewMode as keyof typeof folderQueries]
    : { data: undefined, isLoading: false };

  const flatData = useMemo(() => {
    const d = activeFolderQuery.data as { pages?: Array<{ data: unknown[] }> } | undefined;
    if (!d) return undefined;
    if (d.pages) {
      return { data: d.pages.flatMap((p) => p.data) };
    }
    return d;
  }, [activeFolderQuery.data]);

  const items = useMemo(
    () => normalizeMailRows(viewMode, flatData),
    [flatData, viewMode],
  );
  const categorizedInboxItems = useMemo(
    () =>
      inboxCategories.reduce(
        (acc, category) => {
          acc[category.id] = items.filter(
            (item) => getInboxCategory(item) === category.id,
          );
          return acc;
        },
        {
          primary: [],
          promotions: [],
          social: [],
          updates: [],
        } as Record<InboxCategory, MailListRow[]>,
      ),
    [items],
  );
  const visibleItems =
    viewMode === "inbox" ? categorizedInboxItems[activeInboxCategory] : items;
  const visibleSelectionIds = useMemo(
    () => new Set(visibleItems.map((item) => item.selectionId)),
    [visibleItems],
  );
  const selectedVisibleCount = selectedMessageIds.filter((id) =>
    visibleSelectionIds.has(id),
  ).length;

  const toggleSelectAll = () => {
    if (selectedVisibleCount === visibleItems.length) {
      resetSelection();

      return;
    }

    visibleItems.forEach((item) => {
      if (!selectedMessageIds.includes(item.selectionId)) {
        toggleMessageSelection(item.selectionId);
      }
    });

  };


  if (!isSupportedFolder) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center bg-green-500">
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
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-slate-200 ">
        <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={
                visibleItems.length > 0 &&
                selectedVisibleCount === visibleItems.length
              }
              onChange={toggleSelectAll}
            />
            {selectedVisibleCount > 0 ? (
              <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                <span className="mr-1 text-xs font-bold">
                  {selectedVisibleCount}
                </span>
                <button
                  aria-label={viewMode === "trash" ? "Permanently delete selected" : "Move selected to trash"}
                  className="rounded p-1.5 text-destructive hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    selectedMessageIds
                      .filter((id) => visibleSelectionIds.has(id))
                      .forEach((id) => {
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
                  {visibleItems.length}{" "}
                  {visibleItems.length === 1 ? "conversation" : "conversations"}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              title="No split"
              onClick={() => setSplitPaneMode("none")}
              className={`p-1.5 rounded-md ${splitPaneMode === "none" ? "bg-white shadow-sm text-dana-blue-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              <Square className="h-4 w-4" />
            </button>
            <button
              title="Vertical split"
              onClick={() => setSplitPaneMode("vertical")}
              className={`p-1.5 rounded-md ${splitPaneMode === "vertical" ? "bg-white shadow-sm text-dana-blue-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              <PanelRight className="h-4 w-4" />
            </button>
            <button
              title="Horizontal split"
              onClick={() => setSplitPaneMode("horizontal")}
              className={`p-1.5 rounded-md ${splitPaneMode === "horizontal" ? "bg-white shadow-sm text-dana-blue-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              <PanelBottom className="h-4 w-4" />
            </button>
          </div>
        </div>
        </div>

        {viewMode === "inbox" ? (
          <div className="grid grid-cols-2 border-t border-slate-100 sm:grid-cols-4">
            {inboxCategories.map((category) => {
              const Icon = category.icon;
              const isActive = activeInboxCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    resetSelection();
                    setActiveInboxCategory(category.id);
                  }}
                  className={`relative flex h-14 items-center gap-3 px-5 text-sm font-medium transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                    isActive ? "text-dana-red-600" : "text-slate-600"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="truncate">{category.label}</span>
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {categorizedInboxItems[category.id].length}
                  </span>
                  {isActive ? (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-dana-red-600" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto">
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <div
              key={item.id}
              className={`mail-list-item w-full border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                currentThreadId === item.threadId ? "bg-slate-100" : ""
              } ${item.isUnread ? "bg-blue-50/40" : ""}`}
            >
              <div className="group flex w-full items-center gap-3">
                <input
                  type="checkbox"
                  aria-label={`Select message from ${item.senderName}`}
                  checked={selectedMessageIds.includes(item.selectionId)}
                  onChange={() => {
                    toggleMessageSelection(item.selectionId);
                  }}
                  className={`h-4 w-4 rounded border-slate-300 group-hover:opacity-100`}
                />

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dana-red-600 text-sm font-semibold text-white">
                  {getInitialsFromName(item.senderName)}
                </div>

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
                  className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
               
                  <div className="grid min-w-0 grid-cols-[minmax(120px,180px)_minmax(0,1fr)_auto] items-center gap-3">
                    <div
                      className={`truncate text-sm font-semibold ${
                        item.isDraft ? "text-dana-red-600" : "text-gray-900"
                      }`}
                    >
                      {item.senderName}
                    </div>
                    <div className="min-w-0 truncate text-sm lg:text-base">
                      <span className="font-medium text-gray-800">
                        {item.subject}
                      </span>
                      <span className="mx-2 text-slate-300">-</span>
                      <span className=" text-muted-foreground">
                        {item.bodyPreview}
                      </span>
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
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  {viewMode === "inbox" || viewMode === "starred" ? (
                    <button
                      type="button"
                      disabled={!item.threadId || starThread.isPending}
                      onClick={() => {
                        if (!item.threadId) {
                          return;
                        }

                        const nextStarred = !(
                          starOverrides[item.threadId] ?? item.isStarred
                        );
                        setStarOverrides((current) => ({
                          ...current,
                          [item.threadId as string]: nextStarred,
                        }));
                        starThread.mutate({
                          threadId: item.threadId,
                          isStarred: nextStarred,
                        }, {
                          onError: () => {
                            setStarOverrides((current) => ({
                              ...current,
                              [item.threadId as string]: item.isStarred,
                            }));
                          },
                        });
                      }}
                      title={
                        (item.threadId
                          ? (starOverrides[item.threadId] ?? item.isStarred)
                          : item.isStarred)
                          ? "Unstar"
                          : "Star"
                      }
                      aria-label={
                        (item.threadId
                          ? (starOverrides[item.threadId] ?? item.isStarred)
                          : item.isStarred)
                          ? "Unstar message"
                          : "Star message"
                      }
                      aria-pressed={
                        item.threadId
                          ? (starOverrides[item.threadId] ?? item.isStarred)
                          : item.isStarred
                      }
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Star
                        aria-hidden="true"
                        className={`h-4 w-4 ${
                          item.threadId &&
                          (starOverrides[item.threadId] ?? item.isStarred)
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
                      title="Restore"
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
                      permanentDeleteMail.isPending ||
                      deleteDraft.isPending
                    }
                    onClick={() => {
                      if (!item.messageId) {
                        return;
                      }

                      if (item.isDraft) {
                        deleteDraft.mutate(item.messageId);
                        return;
                      }

                      if (viewMode === "trash") {
                        permanentDeleteMail.mutate(item.messageId);
                        return;
                      }

                      deleteMail.mutate(item.messageId);
                    }}
                    title={item.isDraft ? "Delete draft" : viewMode === "trash" ? "Delete forever" : "Move to trash"}
                    aria-label={item.isDraft ? "Delete draft" : viewMode === "trash" ? "Delete message forever" : "Move message to trash"}
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState viewMode={viewMode} category={activeInboxCategory} />
        )}
      </div>
    </div>
  );
}

function EmptyState({
  viewMode,
  category,
}: {
  viewMode?: MailFolder;
  category?: InboxCategory;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <MailOpen className="h-10 w-10 text-muted-foreground opacity-20" />
      <h3 className="mt-4 text-sm font-semibold">
        {viewMode === "inbox" && category
          ? `No ${inboxCategories.find((item) => item.id === category)?.label.toLowerCase()} messages`
          : "No messages found"}
      </h3>
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
        bodyPreview: formatBodyPreview(draft.bodyHtml, draft.body),
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
        viewMode === "sent"
          ? formatSentHeading(recipients)
          : getSenderDisplayName(sender),
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
      bodyPreview: formatBodyPreview(
        latestMessage?.bodyHtml,
        latestMessage?.body,
      ),
      date: latestMessage?.createdAt,
    };
  });
}

function formatBodyPreview(
  bodyHtml?: string | null,
  body?: string | null,
): string {
  const text = htmlToText(bodyHtml) || body || "";

  return text.replace(/\s+/g, " ").trim() || "(No content)";
}

function formatSentHeading(
  recipients: NonNullable<MailThreadSummary["latestMessage"]>["recipients"] = [],
) {
  const toSummary = formatRecipientSummary(recipients, "to");

  return toSummary ? `To: ${toSummary}` : "To: undisclosed recipients";
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

function getInboxCategory(item: MailListRow): InboxCategory {
  const searchableText = [
    item.senderName,
    item.toSummary,
    item.subject,
    item.bodyPreview,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    hasAnyKeyword(searchableText, [
      "sale",
      "discount",
      "offer",
      "promo",
      "promotion",
      "coupon",
      "deal",
      "marketing",
      "newsletter",
      "unsubscribe",
      "limited time",
      "black friday",
    ])
  ) {
    return "promotions";
  }

  if (
    hasAnyKeyword(searchableText, [
      "facebook",
      "instagram",
      "linkedin",
      "twitter",
      "x.com",
      "social",
      "connection",
      "follow",
      "mentioned you",
      "tagged you",
      "new follower",
    ])
  ) {
    return "social";
  }

  if (
    hasAnyKeyword(searchableText, [
      "alert",
      "notification",
      "update",
      "receipt",
      "invoice",
      "statement",
      "security",
      "password",
      "verification",
      "confirm",
      "confirmed",
      "ticket",
      "status",
      "system",
      "no-reply",
      "noreply",
    ])
  ) {
    return "updates";
  }

  return "primary";
}

function hasAnyKeyword(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function getInitialsFromName(name: string) {
  const [firstName = "", lastName = ""] = name
    .replace(/<.*?>/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (!lastName && firstName.length >= 2) {
    return firstName.slice(0, 2).toUpperCase();
  }

  return getInitials(firstName, lastName);
}

function getSenderDisplayName(sender?: SenderSummary | null) {
  if (!sender) {
    return "Unknown sender";
  }

  const fullName =
    "name" in sender && typeof sender.name === "string"
      ? sender.name
      : [sender.firstName, sender.lastName].filter(Boolean).join(" ").trim();

  return fullName || sender.email || "Unknown sender";
}
