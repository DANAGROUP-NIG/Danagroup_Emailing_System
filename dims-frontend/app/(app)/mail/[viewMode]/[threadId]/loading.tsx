import { Skeleton } from "@/components/ui/Skeleton";

// Thread pane skeleton — shown while a thread's messages load
export default function ThreadLoading() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-card p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Thread subject */}
        <div className="space-y-3 border-b border-border pb-6">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-44" />
        </div>

        {/* Message card */}
        <div className="rounded-2xl border border-border p-6">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-52" />
                </div>
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[94%]" />
            <Skeleton className="h-4 w-[88%]" />
            <Skeleton className="h-4 w-[72%]" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>

        {/* Reply area skeleton */}
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    </div>
  );
}
