import Image from "next/image";
import { ToastProvider } from "@/components/ui/Toast";
import logoBg from "@/assets/Elegantly designed envelope with gradient swoosh.jpg";
import logo from "@/assets/logo.png";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-background">
        {/* ── Left panel (brand) — hidden below lg ── */}
        <div className="relative hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col">
          {/* Background image + overlay */}
          <Image
            src={logoBg}
            alt=""
            aria-hidden="true"
            fill
            priority
            className="object-cover"
            sizes="45vw"
          />
          <div className="absolute inset-0 bg-dana-blue-900/80" />

          {/* Content layered above overlay */}
          <div className="relative z-10 flex flex-1 flex-col justify-between p-10 text-white">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image
                src={logo}
                alt="Dana Group logo"
                width={144}
                height={28}
                className="object-contain"
              />
              <span className="text-lg font-semibold tracking-wide">
                Dana Group
              </span>
            </div>

            {/* Centre tagline */}
            <div className="space-y-4">
              <p className="text-3xl font-bold leading-tight text-balance">
                Internal Communication.{" "}
                <span className="text-dana-blue-200">Reimagined.</span>
              </p>
              <p className="text-sm text-dana-blue-200 leading-relaxed max-w-xs">
                DIMS keeps every message, announcement, and conversation across
                Dana Group subsidiaries in one secure place.
              </p>
            </div>

            {/* Footer quote */}
            <p className="text-xs text-dana-blue-300">
              &copy; {new Date().getFullYear()} Dana Group. All rights reserved.
            </p>
          </div>
        </div>

        {/* ── Right panel (form) ── */}
        <div className="flex flex-1 flex-col">
          {/* Mobile-only logo header */}
          <header className="flex lg:hidden items-center gap-2 px-6 py-4 border-b border-border">
            <Image
              src={logo}
              alt="Dana Group logo"
              width={112}
              height={22}
              className="object-contain"
            />
            <span className="text-sm font-semibold text-foreground">
              Dana Group — DIMS
            </span>
          </header>

          {/* Vertically centred form area */}
          <div className="flex flex-1 items-center justify-center px-6 py-10">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
