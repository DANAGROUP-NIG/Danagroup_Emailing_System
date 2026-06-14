import { AppShellSkeleton } from "@/components/layout/AppShell";

// Shown while the (app) segment suspends (e.g. during initial auth + data fetch)
export default function AppLoading() {
  return <AppShellSkeleton />;
}
