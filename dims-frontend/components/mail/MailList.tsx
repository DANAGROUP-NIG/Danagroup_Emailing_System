"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Archive, MailOpen, Star, Trash2 } from "lucide-react";
import type { MailFolder } from "@/types/mail.types";
import { useRouter, useParams } from "next/navigation";

type MailFilter = "all" | "unread" | "starred";

interface MailListProps {
  viewMode: MailFolder;
  searchParams?: {
    page?: number;
    filter?: string;
  };
}

interface MailPreview {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  updatedAt: string;
  unread: boolean;
  starred: boolean;
  archived: boolean;
  deleted: boolean;
  folder: MailFolder;
}

const PAGE_SIZE = 15;

// Sample data for demonstration
const SAMPLE_MAILS: MailPreview[] = [
  {
    id: "mail-1",
    senderName: "Amina Yusuf",
    senderEmail: "amina@danagroup.com",
    subject: "Q2 vendor review deck",
    snippet: "I've attached the updated slides and highlighted the budget changes for Friday's call.",
    updatedAt: "2026-04-10T08:15:00.000Z",
    unread: true,
    starred: true,
    archived: false,
    deleted: false,
    folder: "inbox",
  },
  {
    id: "mail-2",
    senderName: "Operations Desk",
    senderEmail: "ops@danagroup.com",
    subject: "Warehouse downtime notice",
    snippet: "Maintenance starts tonight at 11pm CET. Please avoid scheduling dispatches during the window.",
    updatedAt: "2026-04-09T17:42:00.000Z",
    unread: true,
    starred: false,
    archived: false,
    deleted: false,
    folder: "inbox",
  },
  {
    id: "mail-3",
    senderName: "Femi Adeyemi",
    senderEmail: "femi@danagroup.com",
    subject: "Re: Lagos branch hiring plan",
    snippet: "Looks good from finance. We only need the final headcount split before approval.",
    updatedAt: "2026-04-08T13:20:00.000Z",
    unread: false,
    starred: true,
    archived: false,
    deleted: false,
    folder: "sent",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function MailListItem({
  mail,
  isSelected,
  isChecked,
  onSelect,
  onToggleChecked,
}: {
  mail: MailPreview;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: () => void;
  onToggleChecked: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`mail-list-item w-full items-start text-left ${mail.unread ? "unread" : ""} ${
        isSelected ? "selected" : ""
      }`}
    >
      <div className="flex items-center gap-3 px-1">
        <input
          aria-label={`Select ${mail.subject}`}
          type="checkbox"
          checked={isChecked}
          onChange={onToggleChecked}
          onClick={(event) => event.stopPropagation()}
          className="h-4 w-4 rounded border-border"
        />
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dana-blue text-sm font-semibold text-white">
        {getInitials(mail.senderName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{mail.senderName}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground">
             {formatDistanceToNow(new Date(mail.updatedAt), { addSuffix: true })}
          </span>
        </div>
        <p className="truncate text-sm text-foreground">{mail.subject}</p>
        <p className="truncate text-xs text-muted-foreground line-clamp-1">{mail.snippet}</p>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <MailOpen className="h-10 w-10 text-muted-foreground opacity-20" />
      <h3 className="mt-4 text-sm font-semibold text-foreground">No messages found</h3>
      <p className="mt-1 text-xs text-muted-foreground">This folder is empty.</p>
    </div>
  );
}

export default function MailList({ viewMode, searchParams }: MailListProps) {
  const router = useRouter();
  const params = useParams();
  const currentThreadId = params.threadId as string;

  const [activeFilter, setActiveFilter] = useState<MailFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter messages based on viewMode (Inbox, Sent, etc.)
  const folderMessages = useMemo(() => {
    return SAMPLE_MAILS.filter((mail) => {
      if (viewMode === "starred") return mail.starred && !mail.deleted;
      if (viewMode === "trash") return mail.deleted || mail.folder === "trash";
      return mail.folder === viewMode;
    });
  }, [viewMode]);

  // Apply sub-filters (All, Unread, Starred)
  const filteredMessages = useMemo(() => {
    return folderMessages.filter((mail) => {
      if (activeFilter === "unread") return mail.unread;
      if (activeFilter === "starred") return mail.starred;
      return true;
    });
  }, [folderMessages, activeFilter]);

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === filteredMessages.length ? [] : filteredMessages.map((m) => m.id));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header & Bulk Actions Toolbar */}
      <div className="flex flex-col border-b p-4 gap-4 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={selectedIds.length > 0 && selectedIds.length === filteredMessages.length}
              onChange={toggleSelectAll}
            />
            {selectedIds.length > 0 ? (
               <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                 <span className="text-xs font-bold mr-1">{selectedIds.length}</span>
                 <button className="p-1.5 hover:bg-slate-100 rounded text-muted-foreground" title="Archive"><Archive className="h-4 w-4" /></button>
                 <button className="p-1.5 hover:bg-slate-100 rounded text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></button>
               </div>
            ) : (
              <h2 className="text-sm font-bold capitalize text-foreground">{viewMode}</h2>
            )}
          </div>
          
          {/* Sub-folder filter tabs (Inbox only) */}
          {viewMode === "inbox" && (
            <div className="flex bg-slate-100 p-1 rounded-md">
              {(["all", "unread", "starred"] as MailFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-2 py-1 text-[10px] font-bold uppercase rounded transition-all ${
                    activeFilter === f ? "bg-white shadow-sm text-dana-blue" : "text-muted-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Paginated List Area */}
      <div className="flex-1 overflow-y-auto">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((mail) => (
            <MailListItem
              key={mail.id}
              mail={mail}
              isSelected={currentThreadId === mail.id}
              isChecked={selectedIds.includes(mail.id)}
              onSelect={() => router.push(`/mail/${viewMode}/${mail.id}`)}
              onToggleChecked={() => toggleOne(mail.id)}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
