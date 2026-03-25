# Frontend Engineering Blueprint
## Dana Internal Mail & Intranet System (DIMS)

**Document Type:** Frontend Technical Blueprint  
**Prepared by:** IT Development Team — Dana Group Head Office  
**Version:** 1.0

---

## 1. Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14 (App Router) | React framework |
| React | 18 | UI library |
| TypeScript | 5.x | Language |
| TailwindCSS | 3.x | Styling |
| Zustand | 4.x | Global state management |
| TanStack Query | 5.x | Server state + API caching |
| Socket.io Client | 4.x | WebSocket real-time updates |
| Axios | 1.x | HTTP client |
| React Hook Form | 7.x | Form management |
| Zod | 3.x | Schema validation |
| Radix UI | — | Accessible UI primitives |
| Lucide React | — | Icon library |
| date-fns | — | Date formatting |
| DOMPurify | — | HTML email body sanitization |

---

## 2. Project Folder Structure

```
dims-frontend/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Redirect to /mail/inbox
│   │
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx              # Login page
│   │
│   └── (app)/                        # Authenticated routes
│       ├── layout.tsx                # App shell with sidebar
│       │
│       ├── mail/
│       │   ├── inbox/page.tsx
│       │   ├── sent/page.tsx
│       │   ├── drafts/page.tsx
│       │   ├── starred/page.tsx
│       │   ├── trash/page.tsx
│       │   ├── thread/[threadId]/page.tsx
│       │   └── compose/page.tsx
│       │
│       ├── directory/
│       │   ├── page.tsx              # Employee directory
│       │   └── [userId]/page.tsx     # Employee profile
│       │
│       ├── announcements/
│       │   └── page.tsx
│       │
│       └── admin/
│           ├── users/page.tsx
│           ├── departments/page.tsx
│           └── subsidiaries/page.tsx
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── AppShell.tsx
│   │
│   ├── mail/
│   │   ├── MailList.tsx              # Inbox/sent/drafts list
│   │   ├── MailListItem.tsx
│   │   ├── MailThread.tsx            # Full thread view
│   │   ├── MailMessage.tsx           # Individual message in thread
│   │   ├── ComposeModal.tsx          # Compose / reply modal
│   │   ├── RecipientInput.tsx        # Tag-based recipient selector
│   │   ├── AttachmentUploader.tsx
│   │   ├── AttachmentList.tsx
│   │   └── SearchBar.tsx
│   │
│   ├── directory/
│   │   ├── EmployeeCard.tsx
│   │   ├── EmployeeGrid.tsx
│   │   └── EmployeeProfile.tsx
│   │
│   ├── announcements/
│   │   ├── AnnouncementCard.tsx
│   │   └── AnnouncementFeed.tsx
│   │
│   └── ui/                           # Reusable primitives
│       ├── Button.tsx
│       ├── Badge.tsx
│       ├── Avatar.tsx
│       ├── Input.tsx
│       ├── Textarea.tsx
│       ├── Tooltip.tsx
│       ├── Dropdown.tsx
│       ├── Modal.tsx
│       ├── Toast.tsx
│       └── Spinner.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useMail.ts
│   ├── useSocket.ts
│   ├── useDirectory.ts
│   └── useSearch.ts
│
├── lib/
│   ├── api.ts                        # Axios instance
│   ├── queryClient.ts                # TanStack Query client
│   └── utils.ts
│
├── store/
│   ├── authStore.ts                  # Auth state (Zustand)
│   ├── mailStore.ts                  # Mail UI state
│   └── notificationStore.ts         # Notification state
│
├── types/
│   ├── mail.types.ts
│   ├── user.types.ts
│   └── api.types.ts
│
└── middleware.ts                     # Next.js auth middleware
```

---

## 3. UI Pages

### 3.1 Login Page
- Dana Group branded login form
- Email + password fields
- JWT token stored in `httpOnly` cookie via API
- Redirect to inbox on success

### 3.2 Inbox / Mail List
- Two-panel layout (Gmail-style)
- Left panel: paginated list of threads
- Right panel: thread view on click
- Filter tabs: All, Unread, Starred
- Bulk actions: Mark as read, Delete, Archive

### 3.3 Thread View
- All messages in thread displayed chronologically
- Collapsible individual messages
- Inline reply composer at the bottom
- Attachment previews with download links
- Forward button on each message

### 3.4 Compose Modal
- Floating modal (similar to Gmail compose)
- To / CC / BCC recipient fields with autocomplete from employee directory
- Subject field
- Rich text body editor (TipTap or Quill)
- Attachment uploader with drag-and-drop
- Save as Draft button
- Send button

### 3.5 Employee Directory
- Grid/list view of all employees
- Filter by subsidiary, department, or role
- Search by name or email
- Employee card: name, avatar, title, department, email

### 3.6 Employee Profile Page
- Full profile view
- Click "Send Mail" to open compose modal pre-filled with recipient

### 3.7 Announcements
- Company-wide and subsidiary announcements in a feed
- Pinned announcements at top
- Filter by subsidiary or department

### 3.8 Admin Dashboard (Admin roles only)
- User management: create, edit, deactivate
- Department management
- Subsidiary management

---

## 4. State Management

### 4.1 Server State — TanStack Query
All API data is managed by TanStack Query for caching, background refetching, and optimistic updates:

```typescript
// Inbox query
const { data: inbox, isLoading } = useQuery({
  queryKey: ['mail', 'inbox', page],
  queryFn: () => mailApi.getInbox({ page }),
  staleTime: 30_000, // 30 seconds
});

// Mark as read mutation
const { mutate: markRead } = useMutation({
  mutationFn: (id: string) => mailApi.markAsRead(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['mail', 'inbox'] });
  },
});
```

### 4.2 Global UI State — Zustand

```typescript
// mailStore.ts
interface MailStore {
  selectedThreadId: string | null;
  isComposeOpen: boolean;
  composeDefaults: Partial<ComposeData>;
  setSelectedThread: (id: string | null) => void;
  openCompose: (defaults?: Partial<ComposeData>) => void;
  closeCompose: () => void;
}

// notificationStore.ts
interface NotificationStore {
  unreadCount: number;
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markAllRead: () => void;
}
```

---

## 5. Real-Time Updates (WebSocket)

```typescript
// hooks/useSocket.ts
export function useSocket(userId: string) {
  const addNotification = useNotificationStore(s => s.addNotification);
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io('/notifications', {
      auth: { token: getAccessToken() },
    });

    socket.emit('subscribe', { userId });

    socket.on('new_mail', (data) => {
      // Update unread badge count
      addNotification({
        type: 'new_mail',
        title: `New mail from ${data.from}`,
        body: data.subject,
        referenceId: data.messageId,
      });
      // Invalidate inbox query to refresh list
      queryClient.invalidateQueries({ queryKey: ['mail', 'inbox'] });
    });

    return () => socket.disconnect();
  }, [userId]);
}
```

---

## 6. Mail Compose Component

```typescript
// ComposeModal.tsx (key functionality)

// RecipientInput — autocomplete from employee directory
const RecipientInput = () => {
  const [query, setQuery] = useState('');
  const { data: results } = useQuery({
    queryKey: ['users', 'search', query],
    queryFn: () => userApi.search(query),
    enabled: query.length > 1,
  });

  return (
    <Combobox>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search employees..." />
      {results?.map(user => (
        <ComboboxOption key={user.id} value={user}>
          <Avatar src={user.avatarUrl} />
          <span>{user.firstName} {user.lastName}</span>
          <span className="text-muted">{user.email}</span>
        </ComboboxOption>
      ))}
    </Combobox>
  );
};
```

---

## 7. Authentication Flow

```
User visits /mail/inbox
        │
        ▼
middleware.ts checks for valid JWT in cookie
        │
   ┌────┴────┐
   │         │
Valid     Not valid
   │         │
   ▼         ▼
Proceed   Redirect to /login
   │
   ▼
Page renders with user context from /api/auth/me
```

Tokens are stored in `httpOnly` cookies (not `localStorage`) to prevent XSS attacks. Axios intercepts 401 responses and attempts token refresh automatically.

---

## 8. Key UI Design Principles

- **Dana Group Branding:** Primary color palette based on Dana Group's brand identity (dark blue / white)
- **Responsive:** Works on desktop browsers and tablets
- **Accessibility:** All interactive elements keyboard-navigable (Radix UI primitives)
- **Performance:** TanStack Query caches aggressively — navigation between inbox and threads feels instant
- **Safety:** All HTML email body content sanitized with DOMPurify before rendering to prevent XSS

---

## 9. Environment Variables

```env
NEXT_PUBLIC_API_URL=http://dims.danagroup.internal/api
NEXT_PUBLIC_WS_URL=ws://dims.danagroup.internal
NEXT_PUBLIC_APP_NAME=DIMS — Dana Internal Mail
```
