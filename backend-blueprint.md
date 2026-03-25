# Backend Engineering Blueprint
## Dana Internal Mail & Intranet System (DIMS)

**Document Type:** Backend Technical Blueprint  
**Prepared by:** IT Development Team — Dana Group Head Office  
**Version:** 1.0

---

## 1. Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| NestJS | 10.x | Backend framework |
| TypeScript | 5.x | Language |
| PostgreSQL | 15 | Primary database |
| Redis | 7 | Cache + queue broker |
| BullMQ | 3.x | Background job queues |
| Elasticsearch | 8.x | Full-text mail search |
| MinIO | Latest | File/attachment storage |
| Passport.js | — | Auth strategy integration |
| JWT | — | Token-based authentication |
| TypeORM | 0.3.x | ORM for PostgreSQL |
| Jest | — | Testing framework |
| Swagger | — | API documentation |

---

## 2. Project Folder Structure

```
dims-backend/
├── src/
│   ├── main.ts                         # Application entry point
│   ├── app.module.ts                   # Root module
│   │
│   ├── config/                         # Configuration management
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── mail.config.ts
│   │   └── storage.config.ts
│   │
│   ├── common/                         # Shared utilities
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   ├── pipes/
│   │   └── dto/
│   │
│   ├── modules/
│   │   ├── auth/                       # Authentication module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── refresh-token.dto.ts
│   │   │
│   │   ├── users/                      # User management module
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── mail/                       # Core mail module
│   │   │   ├── mail.module.ts
│   │   │   ├── mail.controller.ts
│   │   │   ├── mail.service.ts
│   │   │   ├── mail.gateway.ts         # WebSocket gateway
│   │   │   ├── entities/
│   │   │   │   ├── message.entity.ts
│   │   │   │   ├── message-recipient.entity.ts
│   │   │   │   └── thread.entity.ts
│   │   │   └── dto/
│   │   │       ├── send-mail.dto.ts
│   │   │       └── mail-query.dto.ts
│   │   │
│   │   ├── departments/                # Department + subsidiary management
│   │   │   ├── departments.module.ts
│   │   │   ├── departments.controller.ts
│   │   │   ├── departments.service.ts
│   │   │   └── entities/
│   │   │       ├── department.entity.ts
│   │   │       └── subsidiary.entity.ts
│   │   │
│   │   ├── files/                      # File upload + attachment module
│   │   │   ├── files.module.ts
│   │   │   ├── files.controller.ts
│   │   │   ├── files.service.ts
│   │   │   └── entities/
│   │   │       └── attachment.entity.ts
│   │   │
│   │   ├── notifications/              # Notification module
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.service.ts
│   │   │   └── entities/
│   │   │       └── notification.entity.ts
│   │   │
│   │   ├── announcements/              # Company announcements
│   │   │   ├── announcements.module.ts
│   │   │   ├── announcements.controller.ts
│   │   │   ├── announcements.service.ts
│   │   │   └── entities/
│   │   │       └── announcement.entity.ts
│   │   │
│   │   └── search/                     # Elasticsearch search module
│   │       ├── search.module.ts
│   │       └── search.service.ts
│   │
│   └── jobs/                           # BullMQ background jobs
│       ├── jobs.module.ts
│       ├── mail-delivery.processor.ts
│       ├── search-indexer.processor.ts
│       └── notification.processor.ts
│
├── test/
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## 3. Database Schema

### 3.1 Entities and Relationships

```
subsidiaries ──< departments ──< users
                                    │
                              ┌─────┴──────┐
                              ▼            ▼
                           messages    notifications
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
           message_recipients       attachments
                    │
                    ▼
                 threads
```

### 3.2 Table Definitions

```sql
-- Subsidiaries
CREATE TABLE subsidiaries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  domain      VARCHAR(50) NOT NULL UNIQUE,  -- e.g. danaair.internal
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Departments
CREATE TABLE departments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) NOT NULL,
  subsidiary_id  UUID NOT NULL REFERENCES subsidiaries(id),
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(200) NOT NULL UNIQUE,  -- e.g. john.doe@danaair.internal
  password_hash   VARCHAR(255) NOT NULL,
  department_id   UUID REFERENCES departments(id),
  subsidiary_id   UUID REFERENCES subsidiaries(id),
  role            VARCHAR(50) NOT NULL DEFAULT 'employee',
  job_title       VARCHAR(150),
  avatar_url      VARCHAR(255),
  is_active       BOOLEAN DEFAULT TRUE,
  last_login_at   TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Threads (conversation grouping)
CREATE TABLE threads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject     VARCHAR(500) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    UUID NOT NULL REFERENCES threads(id),
  sender_id    UUID NOT NULL REFERENCES users(id),
  subject      VARCHAR(500) NOT NULL,
  body         TEXT NOT NULL,
  body_html    TEXT,
  is_draft     BOOLEAN DEFAULT FALSE,
  sent_at      TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Message Recipients (To, CC, BCC)
CREATE TABLE message_recipients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id),
  type         VARCHAR(10) NOT NULL DEFAULT 'to',  -- to | cc | bcc
  is_read      BOOLEAN DEFAULT FALSE,
  is_starred   BOOLEAN DEFAULT FALSE,
  is_deleted   BOOLEAN DEFAULT FALSE,
  is_archived  BOOLEAN DEFAULT FALSE,
  read_at      TIMESTAMP
);

-- Attachments
CREATE TABLE attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  filename     VARCHAR(255) NOT NULL,
  mime_type    VARCHAR(100) NOT NULL,
  size_bytes   INTEGER NOT NULL,
  storage_key  VARCHAR(500) NOT NULL,  -- MinIO object key
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id),
  type         VARCHAR(50) NOT NULL,  -- new_mail | announcement | system
  title        VARCHAR(255) NOT NULL,
  body         TEXT,
  is_read      BOOLEAN DEFAULT FALSE,
  reference_id UUID,  -- message_id or announcement_id
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Announcements
CREATE TABLE announcements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id      UUID NOT NULL REFERENCES users(id),
  title          VARCHAR(500) NOT NULL,
  body           TEXT NOT NULL,
  target         VARCHAR(50) DEFAULT 'all',  -- all | subsidiary | department
  subsidiary_id  UUID REFERENCES subsidiaries(id),
  department_id  UUID REFERENCES departments(id),
  is_pinned      BOOLEAN DEFAULT FALSE,
  published_at   TIMESTAMP,
  created_at     TIMESTAMP DEFAULT NOW()
);
```

---

## 4. API Endpoints

### 4.1 Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login with email + password |
| POST | `/api/auth/logout` | Invalidate session token |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user profile |

### 4.2 Mail

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/mail/send` | Send a new message |
| GET | `/api/mail/inbox` | Get inbox messages (paginated) |
| GET | `/api/mail/sent` | Get sent messages |
| GET | `/api/mail/drafts` | Get draft messages |
| GET | `/api/mail/thread/:threadId` | Get all messages in a thread |
| GET | `/api/mail/:id` | Get a single message |
| PATCH | `/api/mail/:id/read` | Mark message as read |
| PATCH | `/api/mail/:id/star` | Star/unstar a message |
| DELETE | `/api/mail/:id` | Move to trash |
| POST | `/api/mail/draft` | Save a draft |
| PUT | `/api/mail/draft/:id` | Update a draft |

### 4.3 Users & Directory

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all employees (paginated, searchable) |
| GET | `/api/users/:id` | Get employee profile |
| GET | `/api/users/search?q=` | Search employees by name/department |
| POST | `/api/users` | Create user (Admin only) |
| PATCH | `/api/users/:id` | Update user profile |
| DELETE | `/api/users/:id` | Deactivate user (Admin only) |

### 4.4 Files & Attachments

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/files/upload` | Upload attachment |
| GET | `/api/files/:id` | Download/view attachment |
| DELETE | `/api/files/:id` | Delete attachment |

### 4.5 Announcements

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/announcements` | List announcements |
| POST | `/api/announcements` | Post announcement (Admin/Manager) |
| PATCH | `/api/announcements/:id` | Update announcement |
| DELETE | `/api/announcements/:id` | Delete announcement |

### 4.6 Search

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/search?q=&type=mail` | Search mail by keyword |
| GET | `/api/search?q=&type=users` | Search users |

---

## 5. Email Threading Logic

DIMS uses Gmail-style conversation threads:

1. When a user sends a **new** message, a new `thread` is created with the message subject as the thread subject
2. When a user **replies**, the reply is associated with the same `thread_id`
3. The inbox displays one entry per thread, showing the latest message
4. Opening a thread loads all messages in chronological order

```typescript
// Send mail service logic (simplified)
async sendMail(senderId: string, dto: SendMailDto) {
  let threadId = dto.threadId;

  // New conversation — create thread
  if (!threadId) {
    const thread = await this.threadRepo.save({ subject: dto.subject });
    threadId = thread.id;
  }

  // Create message
  const message = await this.messageRepo.save({
    threadId,
    senderId,
    subject: dto.subject,
    body: dto.body,
    bodyHtml: dto.bodyHtml,
    sentAt: new Date(),
  });

  // Create recipient records
  for (const recipient of dto.to) {
    await this.recipientRepo.save({
      messageId: message.id,
      recipientId: recipient.id,
      type: 'to',
    });
  }

  // Enqueue delivery + notification jobs
  await this.mailQueue.add('deliver', { messageId: message.id });
  await this.mailQueue.add('index', { messageId: message.id });
  await this.mailQueue.add('notify', { messageId: message.id });

  return message;
}
```

---

## 6. File Attachment Handling

```typescript
// Upload flow
// 1. Client POSTs file to /api/files/upload (multipart/form-data)
// 2. FilesService validates type and size
// 3. File saved to MinIO under key: attachments/{userId}/{uuid}/{filename}
// 4. Attachment record created in DB with storage_key
// 5. attachment.id returned to client
// 6. Client includes attachment IDs in mail send request

// Download flow
// 1. Client GETs /api/files/:id
// 2. FilesService generates a short-lived pre-signed URL from MinIO
// 3. Client redirected to pre-signed URL for download
```

Allowed file types: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.png`, `.jpg`, `.jpeg`, `.zip`  
Maximum attachment size: **20MB per file**, **50MB per message**

---

## 7. Background Jobs (BullMQ)

### 7.1 Mail Delivery Job
- Marks `message_recipients` rows as delivered
- Updates thread `updated_at` timestamp

### 7.2 Search Indexer Job
- Indexes message into Elasticsearch after delivery
- Fields indexed: `subject`, `body` (stripped HTML), `sender_name`, `sent_at`

### 7.3 Notification Job
- Creates notification records in DB for each recipient
- Pushes real-time notification via WebSocket to connected clients

### 7.4 Cleanup Job (Scheduled — weekly)
- Permanently deletes messages in trash older than 30 days
- Removes orphaned file attachments from MinIO

---

## 8. WebSocket Gateway

```typescript
@WebSocketGateway({ namespace: '/notifications', cors: false })
export class MailGateway {
  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    client.join(`user-${data.userId}`);
  }
}

// Emitting new mail notification to a specific user
this.server.to(`user-${recipientId}`).emit('new_mail', {
  messageId,
  subject,
  from: senderName,
  timestamp: new Date(),
});
```

---

## 9. Role-Based Access Control

| Role | Permissions |
|---|---|
| `employee` | Read/write own mailbox, view directory, read announcements |
| `manager` | All employee permissions + post announcements to their department |
| `subsidiary_admin` | All manager permissions + manage users within subsidiary |
| `group_admin` | Full access — manage all users, subsidiaries, and system config |

---

## 10. Environment Configuration

```env
# Application
NODE_ENV=production
PORT=3000
APP_URL=http://dims.danagroup.internal

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dims_db
DB_USER=dims_user
DB_PASSWORD=strong_password_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minio_access_key
MINIO_SECRET_KEY=minio_secret_key
MINIO_BUCKET=dims-attachments

# Elasticsearch
ES_NODE=http://localhost:9200

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```
