import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4">
      <div className="rounded-xl bg-dana-blue-900 px-6 py-3">
        <Image src={logo} width={140} height={36} alt="Dana Group" priority />
      </div>

      <div className="text-center">
        <p className="text-8xl font-extrabold tracking-tight text-dana-blue-900">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      <Link
        href="/mail/inbox"
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-dana-sm transition-colors hover:bg-primary-hover"
      >
        Go to Inbox
      </Link>
    </div>
  );
}
