import Image from "next/image";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthMobileHeader } from "@/components/auth/AuthMobileHeader";
import bgImage from "@/assets/auth_image.png";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-background">
        {/* ── Left panel (brand) — hidden below lg ── */}
        <div className="relative hidden lg:flex lg:w-[45%] xl:w-[50%] flex-col">
          {/* Content layered above overlay */}
          <div className="relative z-10 flex h-full flex-col items-center justify-between gap-6 px-6 py-10 text-center text-white">

            {/* Left Banner */}
            <Image 
              src={bgImage}
              alt=""
              aria-hidden="true"
              fill
              priority
              className="object-cover"
              sizes="45vw"
            />

            {/* Centre tagline */}
            {/* <div className="space-y-4">
              <p className="text-3xl font-bold leading-tight text-balance">
                Internal Communication.{" "}
                <span className="text-dana-blue-200">Reimagined.</span>
              </p>
              <p className="text-sm text-dana-blue-200 leading-relaxed max-w-xs">
                DIMS keeps every message, announcement, and conversation across
                Dana Group subsidiaries in one secure place.
              </p>
            </div> */}

            {/* Footer quote */}
            <p className="text-xs text-dana-blue-300">
              &copy; {new Date().getFullYear()} Dana Group. All rights reserved.
            </p>
          </div>
        </div>

        {/* ── Right panel (form) ── */}
        <div className="flex flex-1 flex-col">
          {/* Mobile-only logo header */}
          <AuthMobileHeader />

          {/* Vertically centred form area */}
          <div className="flex flex-1 items-center justify-center px-6 py-10">
            <div className="w-full max-w-md">
              {/* <Suspense fallback={null}>
                <AuthModeSwitch />
              </Suspense> */}
              {children}
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
