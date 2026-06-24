import MailList from "@/components/mail/MailList";
import { MailFolder } from "@/types/mail.types";

export default function MailFolderPage({
  params,
}: {
  params: { viewMode: MailFolder };
}) {
  return <MailList viewMode={params.viewMode} />;
}
