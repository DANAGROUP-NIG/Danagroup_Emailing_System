import Image from "next/image";
import logo from "@/assets/logo.png";
import { Spinner } from "@/components/ui/Spinner";

// Global loading splash — shown while the root layout suspends
export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-dana-blue-900">
      <div className="rounded-xl bg-white px-6 py-3">
        <Image src={logo} width={160} height={40} alt="Dana Group" priority />
      </div>
      <Spinner size="lg" className="text-white" />
      <p className="text-sm font-medium text-blue-100/70">Loading DIMS&hellip;</p>
    </div>
  );
}
