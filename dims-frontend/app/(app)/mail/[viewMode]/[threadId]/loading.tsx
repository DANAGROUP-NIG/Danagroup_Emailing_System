import { Skeleton } from "@/components/ui/Skeleton";

// Thread panel skeleton, shown while a thread's messages load.
export default function ThreadLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-80" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 lg:px-8">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-4 w-44" />
          </div>

          <div className="rounded-2xl border border-border bg-white p-6">
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
        </div>
      </div>
    </div>
  );
}
