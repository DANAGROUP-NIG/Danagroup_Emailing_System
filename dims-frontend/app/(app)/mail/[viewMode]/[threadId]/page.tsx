

// TODO: Implement Thread View Page
// - All messages in thread displayed chronologically (MailThread component)
// - Collapsible individual messages
// - Inline reply composer at the bottom
// - Attachment previews with download links
// - Forward button on each message
// - Params: threadId (UUID)

// app/(app)/mail/[viewMode]/[threadId]/page.tsx
import { Suspense } from "react";
import MailThread from "@/components/mail/MailThread";
import Spinner from "@/components/ui/Spinner";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>; // Define as a Promise for Next.js 15
}) {
  // Await the params before destructuring
  const { threadId } = await params; 

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
        <MailThread threadId={threadId} />
      </Suspense>
    </div>
  );
}
