import { Skeleton } from "@/components/ui/Skeleton";

// Folder panel skeleton, shown while the mail list segment loads.
export default function MailListLoading() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
