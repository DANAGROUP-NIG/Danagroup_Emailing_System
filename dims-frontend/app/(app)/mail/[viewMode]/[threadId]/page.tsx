import { Suspense } from "react";
import MailThread from "@/components/mail/MailThread";
import { Spinner } from "@/components/ui/Spinner";
import { MailFolder } from "@/types/mail.types";

export default function ThreadPage({
  params,
}: {
  params: { viewMode: MailFolder; threadId: string };
}) {
  const { threadId, viewMode } = params;

  if (!threadId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Invalid Thread ID
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <Spinner size="lg" />
          </div>
        }
      >
        <MailThread threadId={threadId} viewMode={viewMode} />
      </Suspense>
    </div>
  );
}
