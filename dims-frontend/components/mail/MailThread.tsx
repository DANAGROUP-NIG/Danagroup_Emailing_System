"use client";

import { useMail } from "@/hooks/useMail";
import { Skeleton } from "@/components/ui/Skeleton";
import MailMessage from "./MailMessage";

export default function MailThread({ threadId }: { threadId: string }) {
  const { useThread } = useMail();
  const { data: threadData, isLoading, error } = useThread(threadId);

  if (isLoading) return <MailThreadSkeleton />;
  if (error || !threadData) return <div className="p-8 text-center text-destructive">Error loading thread.</div>;

  const messages = threadData.messages || [];
  const subject = messages[0]?.subject || "No Subject";

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 lg:p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="mb-8 border-b pb-6">
          <h1 className="text-2xl font-bold text-foreground">{subject}</h1>
        </div>

        <div className="border overflow-hidden flex flex-col gap-3 border-none">
          {messages.map((message, index: number) => {
            const previousSenderId = messages[index - 1]?.sender?.id;
            const isConsecutive =
              index > 0 && previousSenderId === message.sender?.id;

            return (
            <MailMessage
              key={message.id}
              message={message}
              isConsecutive={isConsecutive}
              isCollapsed={index !== messages.length - 1}
            />
          )})}
        </div>
      </div>
    </div>
  );
}

function MailThreadSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-50/30 p-4 lg:p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="mb-8 space-y-3 border-b pb-6">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-44" />
        </div>

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="border-b border-slate-100 p-6 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <Skeleton className="mt-1 h-4 w-4 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
                <Skeleton className="h-3 w-20" />
              </div>

              <div className="mt-6 space-y-3 pl-7">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[94%]" />
                <Skeleton className="h-4 w-[88%]" />
                {index === 2 ? (
                  <Skeleton className="mt-4 h-28 w-full rounded-xl" />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
