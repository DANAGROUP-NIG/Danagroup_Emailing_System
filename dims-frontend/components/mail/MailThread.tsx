"use client";

import { useThread } from "@/hooks/useMail";
import { Skeleton } from "@/components/ui/Skeleton";
import MailMessage from "./MailMessage";
import { Mail } from "lucide-react";

export default function MailThread({ threadId }: { threadId: string }) {
  const { data: threadData, isLoading, error } = useThread(threadId);

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

  return (
    <div data-testid="thread-view" className="flex h-full flex-col bg-[#f5f6fa]">
      {/* Sticky subject header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-lg font-semibold text-slate-800 leading-snug">{subject}</h1>
          {messageCount > 1 && (
            <p className="mt-0.5 text-xs text-slate-500">{messageCount} messages in this thread</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {messages.map((message, index: number) => {
          const previousSenderId = messages[index - 1]?.sender?.id;
          const isConsecutive = index > 0 && previousSenderId === message.sender?.id;

          return (
            <MailMessage
              key={message.id}
              message={message}
              isCollapsed={index !== messages.length - 1}
            />
          )
        })}
      </div>
    </div>
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
