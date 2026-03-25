# Infrastructure & DevOps Plan
## Dana Internal Mail & Intranet System (DIMS)

**Document Type:** Infrastructure & Deployment Plan  
**Prepared by:** IT Development Team — Dana Group Head Office  
**Version:** 1.0

---

## 1. Hosting Options Analysis

| Option | Pros | Cons | Recommendation |
|---|---|---|---|
| **On-premise Data Center** | Full data control, no internet dependency, low recurring cost | Requires physical hardware, IT maintenance overhead | ✅ Recommended for Phase 1 |
| **Private Cloud (AWS/Azure)** | Scalable, managed infrastructure | Data leaves Nigeria, ongoing cloud cost | Consider for Phase 3 |
| **Hybrid** | Flexibility, redundancy | Complexity | Phase 2+ option |

**Recommendation for Phase 1:** Deploy on existing Dana Group server infrastructure (on-premise), using Docker Compose. This approach has zero recurring cloud cost and keeps all data within Dana's internal network.

---

## 2. Phase 1 Server Requirements

### Minimum Recommended Server Specification

| Component | Specification |
|---|---|
| CPU | 8 cores (Intel Xeon or equivalent) |
| RAM | 32 GB |
| Storage (OS + App) | 500 GB SSD |
| Storage (Attachments) | 2 TB HDD (MinIO) |
| Network | 1 Gbps internal LAN |
| OS | Ubuntu Server 22.04 LTS |

For up to 500 concurrent users, a single server handles all services via Docker Compose. When the user base grows beyond 500, services can be distributed across multiple servers.

---

## 3. Docker Compose Architecture (Phase 1)

```yaml
# docker-compose.yml
version: '3.9'

services:

  # Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - api

  # Frontend
  frontend:
    build: ./dims-frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://dims.danagroup.internal/api
    restart: always

  # Backend API
  api:
    build: ./dims-backend
    env_file: .env
    depends_on:
      - postgres
      - redis
      - minio
      - elasticsearch
    restart: always

  # PostgreSQL Database
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: dims_db
      POSTGRES_USER: dims_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  # Redis
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: always

  # MinIO Object Storage
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    restart: always

  # Elasticsearch
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
    volumes:
      - es_data:/usr/share/elasticsearch/data
    restart: always

volumes:
  postgres_data:
  redis_data:
  minio_data:
  es_data:
```

---

## 4. NGINX Reverse Proxy Configuration

```nginx
# nginx.conf

upstream frontend {
    server frontend:3000;
}

upstream api {
    server api:3000;
}

server {
    listen 80;
    server_name dims.danagroup.internal;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name dims.danagroup.internal;

    ssl_certificate /etc/nginx/ssl/dims.crt;
    ssl_certificate_key /etc/nginx/ssl/dims.key;

    # API routes
    location /api {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 60M;  # Allow large attachments
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
    }
}
```

---

## 5. Internal DNS Configuration

Configure Dana Group's internal DNS server to resolve:

```
dims.danagroup.internal  →  [Server IP Address]
```

This allows all employees on the internal network to access DIMS via `https://dims.danagroup.internal` without any manual IP configuration.

---

## 6. CI/CD Pipeline

### Recommended: GitHub Actions (self-hosted runner on Dana server)

```
Developer pushes code to GitHub (private repo)
          │
          ▼
GitHub Actions CI runs:
  ├── Lint + TypeScript check
  ├── Unit tests (Jest)
  └── Build Docker image
          │
     ┌────┴────┐
     │         │
  Tests      Tests
  pass       fail
     │         │
     ▼         ▼
Auto deploy   Block merge
to staging    + notify dev
     │
     ▼
Manual approval for production deploy
     │
     ▼
Docker Compose pull + restart on production server
```

### Pipeline Stages

| Stage | Action | Trigger |
|---|---|---|
| **Lint** | ESLint + TypeScript compiler check | Every push |
| **Test** | Jest unit + integration tests | Every push |
| **Build** | Build Docker images | Merge to `main` |
| **Deploy (Staging)** | Auto deploy to staging server | Merge to `main` |
| **Deploy (Production)** | Manual approval deploy | Tagged release |

---

## 7. Backup Strategy

### Database Backup

```bash
# Automated PostgreSQL backup script (runs daily via cron)
#!/bin/bash
DATE=$(date +%Y-%m-%d)
docker exec dims_postgres pg_dump -U dims_user dims_db | gzip > /backups/db/dims_$DATE.sql.gz
find /backups/db -mtime +30 -delete  # Keep 30 days of backups
```

### Backup Schedule

| Data | Frequency | Retention |
|---|---|---|
| PostgreSQL database | Daily at 2:00 AM | 30 days |
| MinIO attachments | Daily incremental | 90 days |
| Elasticsearch indices | Weekly snapshot | 4 weeks |
| Application config | On every change | Indefinite |

### Backup Destination
Backups stored on a separate NAS drive or secondary server within Dana's internal network. IT team should also consider periodic off-site backup to a USB drive or secondary location.

---

## 8. Monitoring

### Phase 1 — Basic Monitoring

| Tool | Purpose |
|---|---|
| Docker stats | Container resource usage |
| NGINX access logs | Request monitoring |
| PostgreSQL logs | Slow query detection |
| Application logs (Winston) | API error tracking |

### Phase 2 — Full Observability Stack

| Tool | Purpose |
|---|---|
| Prometheus | Metrics collection |
| Grafana | Dashboard visualization |
| Loki | Log aggregation |
| Uptime Kuma | Internal uptime monitoring + alerts |

---

## 9. Deployment Checklist

**Pre-Launch**
- [ ] Server provisioned and OS installed
- [ ] Docker and Docker Compose installed
- [ ] Internal DNS entry created for `dims.danagroup.internal`
- [ ] SSL certificate generated (internal CA or self-signed)
- [ ] Environment variables configured in `.env`
- [ ] Firewall rules set (port 80, 443 open on internal network only)
- [ ] Backup storage directory mounted

**Launch**
- [ ] `docker-compose up -d` on production server
- [ ] Database migrations run
- [ ] Initial admin user created
- [ ] Subsidiaries and departments seeded
- [ ] Smoke test: login, send mail, receive mail, upload attachment

**Post-Launch**
- [ ] Cron jobs for daily backup configured
- [ ] IT team trained on admin dashboard
- [ ] User onboarding email sent to pilot group
- [ ] Help documentation published on internal intranet
