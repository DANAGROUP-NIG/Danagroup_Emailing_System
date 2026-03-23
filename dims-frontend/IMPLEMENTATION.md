# Implementation Guide

## Architecture Overview

This email dashboard follows a **component-based architecture** with **centralized state management** using Zustand.

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layout                        │
├──────────────────┬──────────────────┬──────────────────────┤
│                  │                  │                      │
│   Mail Sidebar   │   Mail List      │   Mail Thread        │
│                  │                  │                      │
│ - Folders        │ - Search Bar     │ - Email Details      │
│ - Labels         │ - Email Items    │ - Reply/Forward      │
│ - Compose Btn    │ - Selection      │ - Attachments        │
│ - Unread Count   │ - Preview        │                      │
└──────────────────┴──────────────────┴──────────────────────┘
         │                │                      │
         └────────────────┼──────────────────────┘
                          │
                 Zustand Mail Store
                (Central State)
```

## Component Hierarchy

### Main Page (`app/page.tsx`)
**Purpose**: Root email dashboard component that orchestrates the entire UI

**Key Responsibilities**:
- Manage selected email state
- Handle folder/view switching
- Filter emails based on search query
- Coordinate between sidebar, list, and thread components

**Props & State**:
```typescript
- currentFolder: string (inbox, sent, drafts, starred)
- selectedMail: string | null (email ID)
- searchQuery: string
- showCompose: boolean
```

### Sidebar (`components/mail/mail-sidebar.tsx`)
**Purpose**: Navigation and folder management

**Features**:
- Compose button
- Folder navigation with unread counts
- Labels with color coding
- Real-time badge updates

**Props**:
```typescript
interface MailSidebarProps {
  currentFolder: string
  onFolderChange: (folder: string) => void
  onCompose: () => void
}
```

### Mail List (`components/mail/mail-list.tsx`)
**Purpose**: Display paginated list of emails

**Features**:
- Email preview cards
- Star/flag emails
- Show sender, subject, time
- Highlight selected email
- Search result display

**Props**:
```typescript
interface MailListProps {
  emails: Email[]
  selectedId: string | null
  onSelectEmail: (id: string) => void
}
```

### Mail Thread (`components/mail/mail-thread.tsx`)
**Purpose**: Display full email with reply/forward

**Features**:
- Full email content
- Sender information
- Attachment list
- Reply/Forward buttons
- Archive/Delete options

**Props**:
```typescript
interface MailThreadProps {
  email: Email
  onClose: () => void
}
```

### Compose Modal (`components/mail/compose-modal.tsx`)
**Purpose**: Email composition interface

**Features**:
- Recipient input
- Subject field
- Rich text body
- File attachment button
- Send/Discard actions

**Props**:
```typescript
interface ComposeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

## State Management with Zustand

### Store Structure
```typescript
interface MailStore {
  emails: Email[]           // All emails
  addEmail: (email: Email) => void
  deleteEmail: (id: string) => void
  updateEmail: (id: string, updates: Partial<Email>) => void
  toggleStar: (id: string) => void
}
```

### Usage Example
```typescript
// In any component:
import { useMailStore } from '@/lib/store/mail-store'

export function MyComponent() {
  const { emails, addEmail, toggleStar } = useMailStore()

  return (
    <div>
      {emails.map(email => (
        <div key={email.id}>
          {email.subject}
          <button onClick={() => toggleStar(email.id)}>
            ★
          </button>
        </div>
      ))}
    </div>
  )
}
```

## Data Flow

### Sending an Email
```
User clicks "Compose"
    ↓
ComposeModal opens
    ↓
User fills form & clicks "Send"
    ↓
API call to POST /api/emails
    ↓
useMailStore.addEmail() updates store
    ↓
Sidebar unread count updates
    ↓
Modal closes & form resets
```

### Selecting an Email
```
User clicks email in MailList
    ↓
onSelectEmail(id) callback triggered
    ↓
selectedMail state updates in page.tsx
    ↓
MailThread component receives email
    ↓
Full email content renders
```

### Searching Emails
```
User types in SearchBar
    ↓
searchQuery state updates
    ↓
Emails are filtered client-side
    ↓
MailList receives filtered array
    ↓
List updates with matching emails
```

## Type System

### Core Types
```typescript
// Email structure
interface Email {
  id: string
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'starred'
  sender: Sender
  recipients: Recipient[]
  subject: string
  body: string
  preview: string
  timestamp: string
  starred: boolean
  read: boolean
  attachments: Attachment[]
}

// Sender information
interface Sender {
  name: string
  email: string
  avatar: string
}

// Attachment metadata
interface Attachment {
  name: string
  size: string
  url?: string
}
```

## Styling System

### Color Tokens (from Tailwind)
- `bg-background` - Main background
- `bg-muted` - Secondary background
- `text-foreground` - Main text
- `text-muted-foreground` - Secondary text
- `border` - Border color

### Key Classes Used
```tailwind
flex items-center justify-between
px-4 py-2 rounded-lg
text-sm font-medium
hover:bg-muted transition-colors
border-l-4 border-primary
gap-4 space-y-2
```

## Admin Dashboard (`app/admin/page.tsx`)

### Features
- **Tabs**: Overview, Users, Settings
- **Overview Tab**:
  - 4 stat cards (total emails, active users, response time, uptime)
  - Line chart (email activity over time)
  - Bar chart (user growth)
  - Pie chart (user distribution)
  - Recent activity stats

- **Users Tab**:
  - User management table
  - Edit/Delete user actions
  - Status indicators (Active/Pending)

- **Settings Tab**:
  - Email configuration
  - Security settings
  - Integration options

## Settings Page (`app/settings/page.tsx`)

### Tabs
1. **Account**: Profile information
2. **Notifications**: Email/push preferences
3. **Security**: Password, 2FA, sessions
4. **SEO**: Meta tags, OG tags, keywords

## API Endpoints

### GET /api/emails
```bash
# Fetch all inbox emails
curl "http://localhost:3000/api/emails?folder=inbox"

# Search emails
curl "http://localhost:3000/api/emails?search=project"
```

### POST /api/emails
```bash
# Send new email
curl -X POST "http://localhost:3000/api/emails" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "john@example.com",
    "subject": "Hello",
    "body": "Hi there!"
  }'
```

### GET /api/admin/stats
```bash
# Get admin statistics
curl "http://localhost:3000/api/admin/stats"
```

## Best Practices Used

### ✅ Component Organization
- Single responsibility principle
- Props interface definitions
- Proper TypeScript typing

### ✅ Performance
- Client-side filtering (fast)
- Efficient re-renders with Zustand
- Lazy loading ready
- Image optimization in place

### ✅ Security
- Input validation ready
- XSS protection via React
- API route validation ready
- Environment variables for secrets

### ✅ Accessibility
- Semantic HTML
- ARIA labels on buttons
- Keyboard navigation
- Color contrast compliance

### ✅ Developer Experience
- Clear file structure
- Comprehensive comments
- Type safety with TypeScript
- Easy to extend and customize

## Extending the Application

### Adding a New Folder
1. Update `EMAIL_FOLDERS` in `lib/constants/email.ts`
2. Add folder to array in `mail-sidebar.tsx`
3. Update `Email` type if needed
4. Extend API filters in `app/api/emails/route.ts`

### Adding a New Feature
1. Create component in `components/mail/`
2. Add types to `lib/types/email.ts`
3. Add store methods in `lib/store/mail-store.ts`
4. Add API endpoint in `app/api/`
5. Integrate with main `app/page.tsx`

### Connecting to Database
1. Install database driver (`pg`, `prisma`, etc.)
2. Update API routes with real queries
3. Modify `mail-store.ts` to call API
4. Add error handling and validation

## Testing Checklist

- [ ] Email list displays correctly
- [ ] Search filters emails properly
- [ ] Star/unstar toggles state
- [ ] Folder navigation works
- [ ] Compose modal opens/closes
- [ ] Email detail view displays correctly
- [ ] Reply/Forward buttons functional
- [ ] Admin dashboard loads stats
- [ ] Settings page saves preferences
- [ ] Mobile responsive layout works
- [ ] Dark mode compatible
- [ ] No console errors

## Production Checklist

- [ ] Environment variables configured
- [ ] Database connected
- [ ] Authentication implemented
- [ ] Error logging setup
- [ ] Analytics integrated
- [ ] SEO meta tags verified
- [ ] Performance optimized
- [ ] Security headers added
- [ ] Deployed to Vercel/hosting
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Backup strategy in place
