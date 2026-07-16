import { MailFolder } from "@/types/mail.types";
import { notFound } from "next/navigation";
import MailSplitLayoutClient from "./MailSplitLayoutClient";

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
    <main className="h-[calc(100vh-73px)] w-full overflow-hidden bg-slate-100">
      <MailSplitLayoutClient viewMode={params.viewMode}>
        {children}
      </MailSplitLayoutClient>
    </main>
  );
}
