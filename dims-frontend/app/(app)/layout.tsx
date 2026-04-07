// TODO: Implement App Shell Layout
// - Authenticated route wrapper
// - Renders Sidebar + TopBar + main content area
// - Providers: TanStack Query, Zustand, WebSocket
// - Redirects to /login if not authenticated
"use client"
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";



export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const router = useRouter();
  const {logout} = useAuthStore();

  const onClick = () => {
    try {
      logout();
      setTimeout(() => router.push("/login"), 100);
    } catch (error: any) {
      console.error("Logout failed:", error);
    }
    
  }
  return <>
  <div>
    <Button label="Logout" btnStyle="py-2 px-6 bg-dana-blue-400 text-white" onClick={onClick}/>
  </div>
    {children}
  </>;
}
