import MailList from "@/components/mail/MailList";
import { MailFolder } from "@/types/mail.types";
import { notFound } from "next/navigation";

const supportedMailFolders: MailFolder[] = ["inbox", "sent", "drafts", "starred", "trash"];

export default function MailSplitLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { viewMode: MailFolder };
}) {
  if (!supportedMailFolders.includes(params.viewMode)) {
    notFound();
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-100">
      <aside className="w-[380px] shrink-0 border-r border-slate-200 bg-white xl:w-[420px]">
        <MailList viewMode={params.viewMode} />
      </aside>

      <main className="flex-1 overflow-hidden bg-slate-100">
        {children}
      </main>
    </div>
  );
}
