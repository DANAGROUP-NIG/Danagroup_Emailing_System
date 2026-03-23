# Setup Guide - Gmail-Like Email Dashboard

## Quick Start

### 1. Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the email dashboard.

## Application Routing

### Main Pages
- **`/`** - Email Dashboard (Main interface)
- **`/admin`** - Admin Dashboard (Analytics and user management)
- **`/settings`** - Settings Page (Account, notifications, security, SEO)

### API Routes
- **`GET /api/emails`** - Fetch emails with optional filters
  - Query params: `folder`, `search`
- **`POST /api/emails`** - Send new email
- **`GET /api/admin/stats`** - Get admin statistics

## Features Overview

### Email Dashboard Features
- ✅ Sidebar navigation with folder structure
- ✅ Email list with search functionality
- ✅ Email thread view with full message
- ✅ Compose email modal
- ✅ Star/flag important emails
- ✅ User profile menu
- ✅ Notification bell
- ✅ Mobile responsive design

### Admin Dashboard
- ✅ Real-time analytics
- ✅ Email activity chart
- ✅ User growth visualization
- ✅ User distribution pie chart
- ✅ User management table
- ✅ System settings configuration
- ✅ Integration management

### Settings Page
- ✅ Account profile management
- ✅ Notification preferences
- ✅ Security settings (2FA, password)
- ✅ SEO configuration
- ✅ Meta tags and Open Graph

## Data Management

### Current Implementation
The app uses **Zustand** for client-side state management with mock data. Sample emails are loaded from `lib/data/sample-emails.ts`.

### Connecting to a Real Database

To connect to your database:

1. **Install database client:**
   ```bash
   pnpm add @prisma/client prisma
   # or
   pnpm add pg
   ```

2. **Update API routes** in `app/api/emails/route.ts` with real database queries

3. **Modify the mail store** in `lib/store/mail-store.ts` to fetch from API instead of using mock data

4. **Add environment variables** to `.env.local`:
   ```env
   DATABASE_URL=your_connection_string
   ```

## Component Structure

### Mail Components
- **mail-sidebar.tsx** - Navigation and folder structure
- **mail-list.tsx** - Email list display
- **mail-thread.tsx** - Email detail view
- **compose-modal.tsx** - Email composition
- **search-bar.tsx** - Email search
- **user-menu.tsx** - User profile menu

### State Management
```typescript
import { useMailStore } from '@/lib/store/mail-store'

// Inside your component:
const { emails, addEmail, deleteEmail, toggleStar } = useMailStore()
```

### Email Types
```typescript
interface Email {
  id: string
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'starred'
  sender: {
    name: string
    email: string
    avatar: string
  }
  recipients: Array<{
    name: string
    email: string
  }>
  subject: string
  body: string
  preview: string
  timestamp: string
  starred: boolean
  read: boolean
  attachments: Array<{
    name: string
    size: string
    url?: string
  }>
}
```

## Customization Guide

### Colors & Theme
Edit `tailwind.config.ts` and `app/globals.css` to customize:
- Primary color
- Background colors
- Text colors
- Border colors

### Email Folders
Add more folders in `lib/constants/email.ts` and update:
- `EMAIL_FOLDERS` constant
- `mail-sidebar.tsx` folders array
- `mail-store.ts` folder types

### Sample Data
Replace sample emails in `lib/data/sample-emails.ts` with your own data structure.

## Best Practices

### Performance
- ✅ Components are split for better code organization
- ✅ Use SWR or React Query for data fetching (recommended)
- ✅ Images are optimized with Next.js Image component
- ✅ Lazy loading for heavy components

### Security
- ✅ Input validation using Zod (already imported)
- ✅ Environment variables for sensitive data
- ✅ XSS protection with React's built-in escaping
- ✅ Add CSRF tokens for form submissions

### Accessibility
- ✅ Semantic HTML structure
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation support
- ✅ Color contrast compliance

### SEO
- ✅ Meta tags in layout.tsx
- ✅ Open Graph tags for social sharing
- ✅ Semantic heading hierarchy
- ✅ Schema markup ready

## Deployment

### Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Self-hosted
```bash
# Build
pnpm build

# Start
pnpm start
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
pnpm dev -- -p 3001
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Zustand State Not Updating
- Ensure you're using the store hook correctly
- Check that mutations are creating new objects (immutability)
- Use React DevTools to inspect store state

## Next Steps

1. ✅ Integrate with real database
2. ✅ Add user authentication (NextAuth.js recommended)
3. ✅ Implement email sending via SMTP
4. ✅ Add real-time updates with WebSocket
5. ✅ Deploy to production
6. ✅ Set up monitoring and analytics

## Support

For detailed documentation on technologies used:
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Zustand](https://github.com/pmndrs/zustand)

Happy coding! 🚀
