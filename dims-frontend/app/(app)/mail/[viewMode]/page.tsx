import { MailOpen } from "lucide-react";

export default function MailEmptyPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-muted-foreground bg-slate-50/10">
      <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        <div className="rounded-full bg-muted/50 p-6">
          <MailOpen className="h-12 w-12 opacity-20" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-foreground">No message selected</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose a thread from the list to view its contents.
        </p>
      </div>
    </div>
  );
}
