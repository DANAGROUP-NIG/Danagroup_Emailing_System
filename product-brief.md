# Product Brief
## Dana Internal Mail & Intranet System (DIMS)

**Prepared by:** IT Development Team — Dana Group Head Office  
**Date:** March 2025  
**Version:** 1.0  
**Classification:** Internal — Management Review

---

## 1. Background

Dana Group of Companies is one of Nigeria's most established conglomerates, with over 50 years of operations spanning aviation, automobiles, manufacturing, healthcare, pharmaceuticals, and consumer goods. Its subsidiaries include Dana Airlines, Kia Nigeria, DFM Nigeria, Dana Plastics, Dana Pharmaceuticals, DLC Africa, and Bubble Wrap Nigeria.

With a workforce distributed across multiple subsidiaries, business units, and physical locations, the organization currently relies on third-party enterprise email platforms — primarily **Google Workspace** and **Zoho Mail** — to facilitate employee communication.

While these platforms are robust and well-supported, a significant portion of Dana Group's workforce does not require external email communication. Factory workers, operations staff, HR personnel, and administrative teams communicate almost exclusively within the organization. Despite this reality, the company currently bears the full per-user licensing cost for each of these employees.

This creates a clear opportunity: by building a purpose-built **internal communication platform**, Dana Group can eliminate unnecessary licensing costs, gain full control of its internal communication infrastructure, and lay the foundation for a modern enterprise intranet.

---

## 2. Problem Statement

Dana Group currently faces the following challenges in its communication infrastructure:

**High Recurring SaaS Licensing Costs**  
Both Google Workspace and Zoho Mail charge per-user, per-month licensing fees. A significant percentage of Dana's employee base does not communicate externally yet consumes the same license tier as employees who do.

**No Centralized Internal Communication Platform**  
There is currently no unified intranet or internal messaging system that allows employees across different subsidiaries to collaborate, share announcements, or access company resources in one place.

**Dependence on Third-Party Infrastructure**  
All internal communications currently flow through external cloud platforms, meaning Dana Group has limited control over its own communication data, uptime guarantees, and policy enforcement.

**Fragmented Communication Across Subsidiaries**  
Employees at Dana Plastics, Kia Nigeria, Dana Airlines, and other subsidiaries operate in isolation without a shared communication channel or directory.

**Data Sovereignty Concerns**  
Sensitive internal communications — HR policies, operational decisions, executive correspondence — are stored on external servers governed by third-party terms of service.

---

## 3. Target Users

### Primary Users — Internal Only (High Priority for License Reduction)

These employees communicate exclusively within the organization and are the primary candidates for migration to DIMS:

| Role | Subsidiary Examples |
|---|---|
| Factory / Production Staff | Dana Plastics, Bubble Wrap Nigeria, DFM Nigeria |
| HR & Admin Teams | All subsidiaries |
| Finance & Accounts | All subsidiaries |
| Internal IT Staff | Dana Group HQ |
| Operations Staff | Dana Airlines ground ops, Kia Nigeria |
| Procurement & Logistics | DFM Nigeria, Dana Pharmaceuticals |

### Secondary Users — Mixed Communication

These employees primarily communicate internally but may occasionally send external emails:

- Department heads and subsidiary managers
- Internal project teams
- Executive assistants

### Excluded Users — External Email Required

These roles will continue using Google Workspace or Zoho Mail due to the nature of their work:

- Sales and business development teams
- Customer support and client-facing staff
- Executive management
- Public relations and marketing
- External partnership and vendor relations teams

---

## 4. Proposed Solution

The **Dana Internal Mail & Intranet System (DIMS)** is a purpose-built, internally hosted enterprise communication platform designed for Dana Group and its subsidiaries.

DIMS will provide the following core capabilities:

### 4.1 Internal Email
A familiar, Gmail-like email experience restricted to internal domains:
- `@danagroup.internal`
- `@danaplast.internal`
- `@danaair.internal`
- `@kianigeria.internal`

Features include Inbox, Compose, Sent, Drafts, Trash, Attachments, Threaded Conversations, and Full-Text Search.

### 4.2 Cross-Subsidiary Communication
Employees can communicate across subsidiaries seamlessly:
> `hr@danaplast.internal` → `operations@danaair.internal`

### 4.3 Employee Directory
A searchable internal directory of all staff across all subsidiaries, with department, role, location, and contact details.

### 4.4 Company Announcements & Intranet
A centralized notice board for company-wide and subsidiary-level announcements, HR circulars, policy documents, and departmental notices.

### 4.5 Document Sharing
Internal file sharing capability for policies, templates, forms, and operational documents.

---

## 5. Core Value Proposition

| Value | Description |
|---|---|
| **Cost Reduction** | Eliminate SaaS licenses for internal-only employees |
| **Data Sovereignty** | All communication data hosted internally, under IT control |
| **Unified Communication** | One platform across all Dana Group subsidiaries |
| **Security** | No exposure to external spam, phishing, or third-party access |
| **Scalability** | Foundation for a full enterprise intranet platform |

---

## 6. Expected Business Benefits

1. **Significant License Cost Savings** — Estimated 40–60% reduction in annual email licensing spend by migrating internal-only users off paid platforms
2. **Full Data Control** — Internal communications no longer stored on external servers
3. **Improved Collaboration** — Employees across subsidiaries can communicate through a single, unified platform
4. **Stronger IT Governance** — IT department controls user access, permissions, and audit trails
5. **Foundation for Growth** — Platform can expand into HR self-service, leave management, helpdesk, and knowledge base
6. **Reduced Vendor Dependency** — Dana Group is no longer solely dependent on Google or Zoho availability

---

## 7. Scope — Phase 1

Phase 1 delivers the core internal mail system:

- ✅ Internal email system (Inbox, Compose, Sent, Drafts, Attachments, Search)
- ✅ User authentication and access management
- ✅ Subsidiary-aware email routing
- ✅ Internal employee directory
- ✅ Company announcement board
- ✅ Admin dashboard for user and department management
- ✅ Basic file/document sharing

---

## 8. Future Expansion — Phase 2 & Beyond

Upon successful delivery of Phase 1, the platform can evolve into a full enterprise intranet:

| Phase | Features |
|---|---|
| Phase 2 | Real-time internal messaging / chat, mobile app |
| Phase 3 | HR self-service portal, leave application management |
| Phase 4 | Internal helpdesk ticketing system |
| Phase 5 | Knowledge base, document management, task management |

---

## 9. High-Level Architecture Overview

DIMS will be built on a modern, internally hosted stack:

- **Frontend:** React / Next.js (web application)
- **Backend:** NestJS (Node.js enterprise framework)
- **Database:** PostgreSQL
- **File Storage:** MinIO (S3-compatible object storage, self-hosted)
- **Search:** Elasticsearch
- **Cache & Queues:** Redis + BullMQ
- **Hosting:** Internal server or private cloud (Docker / Kubernetes)

The system is designed to run entirely within Dana Group's internal network, with no dependency on external internet connectivity for day-to-day communication.

---

## 10. Recommended Next Steps

| Action | Owner | Timeline |
|---|---|---|
| Review and approve this brief | IT Manager / Executive Team | Week 1 |
| Allocate development resources | IT Manager | Week 2 |
| Provision development server environment | Infrastructure Team | Week 2–3 |
| Begin Phase 1 development | Development Team | Week 3 |
| Internal pilot launch | IT + HR | Month 4 |
| Company-wide rollout | IT Department | Month 5–6 |

---

*Prepared by the Dana Group IT Development Team. For enquiries, contact the Head of IT Infrastructure.*
