"use client";

import { useParams } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import MailList from "@/components/mail/MailList";
import { MailFolder } from "@/types/mail.types";
import { MailOpen } from "lucide-react";

export default function MailSplitLayoutClient({
  children,
  viewMode,
}: {
  children: React.ReactNode;
  viewMode: MailFolder;
}) {
  const params = useParams();
  const splitPaneMode = useUIStore((s) => s.splitPaneMode);
  const isThreadView = !!params.threadId;

  if (splitPaneMode === "none") {
    // In "none" mode, the normal routing handles MailList and ThreadViewer separately.
    return <>{children}</>;
  }

  // Split view
  return (
    <div
      className={`flex h-full w-full overflow-hidden ${
        splitPaneMode === "vertical" ? "flex-row" : "flex-col"
      }`}
    >
      <div
        className={`${
          splitPaneMode === "vertical"
            ? "w-[450px] border-r border-slate-200"
            : "h-[350px] border-b border-slate-200"
        } shrink-0 overflow-y-auto bg-white`}
      >
        <MailList viewMode={viewMode} />
      </div>
      <div className="flex-1 overflow-hidden relative bg-white">
        {isThreadView ? (
          children
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-slate-400 bg-slate-50">
            <MailOpen className="h-12 w-12 text-slate-300" />
            <p>Select a message to read</p>
          </div>
        )}
      </div>
    </div>
  );
}
