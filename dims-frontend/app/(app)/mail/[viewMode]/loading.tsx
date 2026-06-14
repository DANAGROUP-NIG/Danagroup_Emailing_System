import { Skeleton } from "@/components/ui/Skeleton";

// MailList pane skeleton — shown while the mail list segment loads
export default function MailListLoading() {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-background">
      {/* List pane */}
      <aside className="w-[380px] shrink-0 border-r border-border bg-card p-4 xl:w-[420px]">
        <div className="mb-4 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="mt-1 h-4 w-4 rounded" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Thread pane placeholder */}
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Select a message</p>
      </div>
    </div>
  );
}
