import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function HomePage() {
  const hasAccessToken = cookies().has("access_token");

  redirect(hasAccessToken ? "/mail/inbox" : "/login");
}
