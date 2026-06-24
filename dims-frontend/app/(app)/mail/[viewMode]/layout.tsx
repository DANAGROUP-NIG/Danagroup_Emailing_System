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
    <main className="h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-100">
      {children}
    </main>
  );
}
