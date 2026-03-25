// TODO: Implement AppShell Component
// - Wraps all authenticated pages
// - Renders Sidebar (fixed left) + main content area (flex-1 overflow-y-auto)
// - Renders TopBar at the top of the main content area
// - Mounts useSocket hook to establish WebSocket connection
// - Mounts TanStack Query provider and Zustand providers
// - Contains ComposeModal (rendered globally so it floats over any page)

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Implement
  return <>{children}</>;
}
