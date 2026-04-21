// TODO: Implement TopBar Component
// - Top navigation bar for the app shell
// - Left: Page title / breadcrumb
// - Center: Global SearchBar component
// - Right: Notification bell (with unread count badge from notificationStore)
// - Right: Current user Avatar + dropdown (profile, logout)

import { useMailStore } from "@/store/mailStore";

// - Logout calls POST /api/auth/logout then clears authStore

export default function TopBar() {

  // TODO: Implement
  return (
    <nav>
      <div className="bg-dana-red-600 h-12"> Top Bar</div>
    </nav>
  );
}
