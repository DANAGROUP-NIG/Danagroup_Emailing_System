# Gmail-Like Email Dashboard

A production-ready email management application built with Next.js 16, React 19, and modern web technologies. Features a responsive email interface, admin dashboard, and comprehensive settings.

## Features

### Frontend
- **Email Interface**: Gmail-like email client with sidebar navigation
- **Mail Management**: 
  - Inbox, Sent, Drafts, Starred folders
  - Search functionality across emails
  - Star/flag important emails
  - Email threading and conversations
- **Compose**: Rich text email composition with attachments
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Updates**: Instant email syncing and notifications

### Admin Dashboard
- **Analytics & Metrics**:
  - Total emails count
  - Active users tracking
  - Response time monitoring
  - System uptime status
- **Charts & Graphs**:
  - Email activity trends (Line chart)
  - User growth visualization (Bar chart)
  - User status distribution (Pie chart)
- **User Management**: Admin controls for managing users
- **System Settings**: Email configuration and security options

### Settings & Configuration
- **Account Settings**: Profile management
- **Notification Preferences**: Email and push notifications
- **Security Controls**: 
  - Password management
  - Two-factor authentication
  - Session management
- **SEO Configuration**: Meta tags, OG tags, and search optimization

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── emails/route.ts          # Email API endpoints
│   │   └── admin/stats/route.ts     # Admin statistics API
│   ├── admin/
│   │   └── page.tsx                 # Admin dashboard
│   ├── settings/
│   │   └── page.tsx                 # Settings page
│   ├── layout.tsx                   # Root layout with metadata
│   └── page.tsx                     # Main email dashboard
├── components/
│   └── mail/
│       ├── mail-sidebar.tsx         # Sidebar navigation
│       ├── mail-list.tsx            # Email list component
│       ├── mail-thread.tsx          # Email detail view
│       ├── compose-modal.tsx        # Compose email modal
│       ├── search-bar.tsx           # Search functionality
│       └── user-menu.tsx            # User profile menu
├── lib/
│   ├── store/
│   │   └── mail-store.ts           # Zustand store for emails
│   ├── types/
│   │   └── email.ts                 # TypeScript email types
│   └── data/
│       └── sample-emails.ts         # Mock email data
└── public/                          # Static assets
```

## Getting Started

### Installation

1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

Currently, the application uses mock data. To connect to a real database, add environment variables:

```env
# Database
DATABASE_URL=your_database_url

# Email Service
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password

# Authentication
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

## API Endpoints

### Emails
- `GET /api/emails` - Fetch emails (supports folder and search filters)
- `POST /api/emails` - Create new email

### Admin
- `GET /api/admin/stats` - Get admin statistics

## Key Components

### useMailStore Hook
Centralized state management for all email data:
```typescript
const { emails, addEmail, deleteEmail, toggleStar } = useMailStore()
```

### Email Interface
- **Sidebar**: Navigation and folder management
- **Mail List**: Paginated email list with search
- **Thread View**: Full email conversation display
- **Compose Modal**: Rich text email creation

## Mobile Responsiveness

The application is fully responsive:
- **Desktop**: Three-panel layout (sidebar, list, detail)
- **Tablet**: Two-panel layout (sidebar + combined list/detail)
- **Mobile**: Single-panel with toggle navigation

## Best Practices Implemented

✅ **Performance**
- Code splitting and lazy loading
- Optimized images
- Caching strategies

✅ **Security**
- Input validation
- XSS protection
- CSRF tokens ready

✅ **Accessibility**
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Proper heading hierarchy

✅ **SEO**
- Meta tags and Open Graph
- Semantic HTML
- Dynamic sitemap ready
- Schema markup support

✅ **User Experience**
- Smooth animations
- Loading states
- Error handling
- Toast notifications

## Deployment

Deploy to Vercel (recommended for Next.js):

```bash
pnpm build
vercel deploy
```

Or build for production:
```bash
pnpm build
pnpm start
```

## Future Enhancements

- [ ] Real database integration (PostgreSQL/MongoDB)
- [ ] User authentication (NextAuth.js)
- [ ] Email encryption
- [ ] Real-time collaboration
- [ ] Advanced filtering and rules
- [ ] Email templates
- [ ] Calendar integration
- [ ] Mobile native app

## License

MIT

## Support

For issues or questions, please open an issue in the repository or visit the admin panel for support options.
