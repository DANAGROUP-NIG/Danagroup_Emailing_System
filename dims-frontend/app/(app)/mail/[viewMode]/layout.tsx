import MailList from "@/components/mail/MailList";
import { MailFolder } from "@/types/mail.types";

export default function MailSplitLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { viewMode: MailFolder };
}) {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden">
      {/* MASTER: Left Column */}
      <aside className="w-[400px] shrink-0 border-r bg-white">
        <MailList viewMode={params.viewMode} />
      </aside>

      {/* DETAIL: Right Column (Children) */}
      <main className="flex-1 overflow-hidden bg-slate-50/20">
        {children}
      </main>
    </div>
  );
}
