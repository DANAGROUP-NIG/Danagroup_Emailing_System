# System Architecture Document
## Dana Internal Mail & Intranet System (DIMS)

**Document Type:** Technical Architecture  
**Prepared by:** IT Development Team — Dana Group Head Office  
**Version:** 1.0  
**Classification:** Internal — Technical Review

---

## 1. System Overview

DIMS (Dana Internal Mail & Intranet System) is a self-hosted, internally deployed enterprise communication platform. It provides email-like messaging restricted to internal domains, a unified employee directory, company announcement features, and document sharing — all operating within Dana Group's private network.

The system is designed around the principle of **zero external dependency** for internal communication. No messages, user data, or attachments are transmitted to or stored on external servers.

### Design Goals

- Internal-only communication across all Dana Group subsidiaries
- Familiar Gmail-like user experience
- Subsidiary-aware routing and namespacing
- Horizontally scalable architecture
- Secure by design — no public internet exposure
- Extensible for future intranet features

---

## 2. Architecture Style

DIMS will follow a **Modular Monolith** architecture for Phase 1, with clear module boundaries that allow migration to microservices in Phase 2+ if scale demands it.

**Rationale:**

| Factor | Modular Monolith | Microservices |
|---|---|---|
| Deployment complexity | Low | High |
| Team size needed | Small (2–5 devs) | Larger (10+) |
| Operational overhead | Low | High |
| Internal IT capacity | More appropriate | Requires DevOps expertise |
| Scalability path | Migrate modules later | Immediate but complex |

The modular monolith allows Dana IT to ship faster in Phase 1, with clearly separated domain modules (Mail, Auth, Users, Notifications, Files) that can be extracted into independent services later.

---

## 3. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        DANA INTERNAL NETWORK                    │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐    ┌──────────────────┐  │
│  │  Employee    │     │  Employee    │    │  IT Admin        │  │
│  │  Browser     │     │  Mobile      │    │  Dashboard       │  │
│  └──────┬───────┘     └──────┬───────┘    └────────┬─────────┘  │
│         │                   │                      │             │
│         └─────────────┬─────┘──────────────────────┘             │
│                       ▼                                          │
│         ┌─────────────────────────┐                             │
│         │      NGINX / Reverse    │                             │
│         │         Proxy           │                             │
│         └────────────┬────────────┘                             │
│                      ▼                                          │
│         ┌─────────────────────────┐                             │
│         │    Next.js Frontend     │                             │
│         │  (React / TypeScript)   │                             │
│         └────────────┬────────────┘                             │
│                      ▼                                          │
│         ┌─────────────────────────┐                             │
│         │      API Gateway        │                             │
│         │   (NestJS REST API)     │                             │
│         └──┬──────┬──────┬───┬───┘                             │
│            │      │      │   │                                  │
│     ┌──────┘  ┌───┘  ┌───┘  └──────┐                          │
│     ▼         ▼      ▼             ▼                            │
│  ┌──────┐ ┌──────┐ ┌──────┐  ┌──────────┐                      │
│  │ Auth │ │ Mail │ │ User │  │  File    │                      │
│  │Module│ │Module│ │Module│  │  Module  │                      │
│  └──┬───┘ └──┬───┘ └──┬───┘  └────┬─────┘                      │
│     │        │        │           │                             │
│     ▼        ▼        ▼           ▼                             │
│  ┌────────────────────────────────────────┐                     │
│  │           Core Data Layer              │                     │
│  │                                        │                     │
│  │  ┌──────────┐  ┌──────┐  ┌─────────┐  │                     │
│  │  │PostgreSQL│  │Redis │  │  MinIO  │  │                     │
│  │  │ (Primary)│  │Cache │  │(Storage)│  │                     │
│  │  └──────────┘  └──────┘  └─────────┘  │                     │
│  │                                        │                     │
│  │  ┌──────────────┐  ┌────────────────┐  │                     │
│  │  │Elasticsearch │  │BullMQ (Queues) │  │                     │
│  │  │   (Search)   │  │  + Redis       │  │                     │
│  │  └──────────────┘  └────────────────┘  │                     │
│  └────────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Core Components

### 4.1 Frontend Application
- **Technology:** Next.js (React, TypeScript, TailwindCSS)
- **Purpose:** Gmail-like UI for composing, reading, and managing internal mail; employee directory; announcements; admin panel
- **Delivery:** Single-page application served via NGINX
- **Real-time:** WebSocket connection for live mail notifications

### 4.2 API Gateway (NestJS Backend)
- **Technology:** NestJS (Node.js), REST API
- **Purpose:** Central entry point for all client requests. Routes requests to the appropriate domain module.
- **Features:** JWT authentication middleware, rate limiting, request validation, logging

### 4.3 Auth Module
- **Purpose:** User login, session management, JWT issuance
- **Technology:** JWT + bcrypt password hashing, Redis for session/token blacklist
- **Future:** LDAP / Active Directory integration for SSO

### 4.4 Mail Module
- **Purpose:** Core internal email functionality — compose, send, receive, thread management
- **Key Logic:** Message storage in PostgreSQL, message queuing via BullMQ, full-text search via Elasticsearch
- **Threading:** Gmail-style conversation threads grouped by subject/thread ID

### 4.5 User Module
- **Purpose:** Employee profile management, department management, subsidiary management
- **Features:** Employee directory search, profile pages, role-based access

### 4.6 File Module
- **Purpose:** Attachment upload, storage, and retrieval
- **Technology:** MinIO (self-hosted S3-compatible object storage)
- **Security:** Pre-signed internal URLs, file type validation, size limits

### 4.7 Notification Module
- **Purpose:** Deliver real-time and in-app notifications for new messages
- **Technology:** WebSockets (via NestJS Gateway), BullMQ background jobs

### 4.8 Search Service
- **Purpose:** Full-text search across mail subject, body, and sender
- **Technology:** Elasticsearch — messages indexed asynchronously after delivery

### 4.9 Message Queue
- **Technology:** BullMQ + Redis
- **Jobs:** Message delivery, search indexing, notification dispatch, email digest generation

---

## 5. Internal Mail Flow

```
User Composes Mail
       │
       ▼
POST /api/mail/send
       │
       ▼
Mail Module validates recipients (must be @*.internal domains)
       │
       ▼
Message written to PostgreSQL (messages + message_recipients tables)
       │
       ▼
BullMQ Job enqueued: [DELIVER_MESSAGE, INDEX_MESSAGE, NOTIFY_RECIPIENT]
       │
     ┌─┴──────────────┬──────────────────┐
     ▼                ▼                  ▼
Delivery Job     Index Job           Notify Job
(marks as         (Elasticsearch)     (WebSocket push
 delivered)                            to recipient)
```

---

## 6. Domain-Based Routing

Each subsidiary has its own internal domain namespace:

| Subsidiary | Internal Domain |
|---|---|
| Dana Group HQ | `@danagroup.internal` |
| Dana Airlines | `@danaair.internal` |
| Kia Nigeria | `@kianigeria.internal` |
| Dana Plastics | `@danaplast.internal` |
| Dana Pharmaceuticals | `@danapharma.internal` |
| DFM Nigeria | `@dfmnigeria.internal` |
| DLC Africa | `@dlcafrica.internal` |
| Bubble Wrap Nigeria | `@bubblewrap.internal` |

All domains are resolved internally. No DNS registration is required — these are purely internal routing identifiers within the DIMS platform.

---

## 7. Data Storage Strategy

### 7.1 PostgreSQL — Primary Database
Stores all structured data: users, departments, messages, threads, recipients, notifications, attachments metadata.

### 7.2 MinIO — Object Storage
Stores file attachments as binary objects. Messages in PostgreSQL reference attachment IDs stored in MinIO. MinIO can be deployed on a local server.

### 7.3 Elasticsearch — Search Engine
All messages are indexed asynchronously after delivery. Provides full-text search across subject, body, and sender fields.

### 7.4 Redis — Cache & Queue Broker
- Session token storage
- JWT blacklist (for logout)
- BullMQ job queue broker
- Frequently accessed data cache (e.g., employee directory lookups)

---

## 8. Security Architecture

### 8.1 Authentication
- JWT-based authentication with short expiry (15-minute access tokens, 7-day refresh tokens)
- All tokens verified on every API request
- Future: LDAP/Active Directory integration

### 8.2 Authorization
- Role-based access control (RBAC): Employee, Manager, Subsidiary Admin, Group Admin
- Users can only access their own mailbox
- Admins can manage users within their subsidiary

### 8.3 Network Security
- System deployed on Dana internal network only
- No public internet exposure
- NGINX reverse proxy with SSL/TLS termination (using internal CA certificate)
- All API calls restricted to internal IP ranges

### 8.4 Data Encryption
- Passwords hashed with bcrypt (cost factor 12)
- TLS encryption in transit (HTTPS internally)
- Database encryption at rest (PostgreSQL tablespace encryption)
- Attachment storage encrypted at rest (MinIO server-side encryption)

### 8.5 Audit Logging
- All login events, mail sends, admin actions, and file accesses logged
- Log retention configurable by IT admin

---

## 9. Scalability Plan

| Phase | Scale Strategy |
|---|---|
| Phase 1 (< 500 users) | Single server deployment (Docker Compose) |
| Phase 2 (500–2000 users) | Multi-container Docker, database replicas |
| Phase 3 (2000+ users) | Kubernetes cluster, horizontal pod autoscaling |

---

## 10. Technology Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, TailwindCSS |
| Backend | NestJS (Node.js), REST API |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Object Storage | MinIO |
| Search | Elasticsearch 8 |
| Queue | BullMQ (Redis-backed) |
| Web Server | NGINX |
| Containerization | Docker + Docker Compose |
| Orchestration (Phase 3) | Kubernetes |
