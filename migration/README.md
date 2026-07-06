# DIMS IMAP Migration Scripts

Batch-migrate email from an old IMAP server into DIMS by piping raw RFC 2822 messages through the inbound webhook.

## Prerequisites

```bash
cd migration
npm install
cp .env.example .env
# Edit .env with source IMAP and DIMS API details
```

## Single-account test

```bash
SOURCE_IMAP_USER=alice@danagroup.com \
SOURCE_IMAP_PASS=secretpassword \
node imap-migrate.mjs
```

## Batch migration

1. Create `accounts.csv` (no header row):

```
alice@danagroup.com,password1
bob@danagroup.com,password2,bob@danagroup.net   # optional explicit dest email
```

2. Run:

```bash
node batch-migrate.mjs accounts.csv
```

A `migration-report-<timestamp>.csv` will be written with per-account results.

## Recommended migration steps

| Step | Action |
|------|--------|
| 1 | Run with 5-10 pilot accounts; verify messages appear in DIMS |
| 2 | Check `migration-report-*.csv` for failures |
| 3 | Re-run failed accounts after fixing connectivity |
| 4 | Migrate all accounts during low-traffic window (nights/weekend) |
| 5 | Update MX record to point to `mail.danagroup.net` |
| 6 | Monitor Postfix logs for 48h after cutover |
| 7 | Keep old server live for 2 weeks for stragglers |

## Environment variables

| Variable | Description |
|----------|-------------|
| `SOURCE_IMAP_HOST` | Hostname of the old mail server |
| `SOURCE_IMAP_PORT` | IMAP port (default: 993) |
| `SOURCE_IMAP_TLS` | Use TLS (default: true) |
| `SOURCE_IMAP_USER` | User email (set per-account in batch) |
| `SOURCE_IMAP_PASS` | User password (set per-account in batch) |
| `DIMS_API_URL` | Base URL of DIMS API (default: http://localhost:8000/api) |
| `INBOUND_WEBHOOK_SECRET` | Must match `INBOUND_WEBHOOK_SECRET` in DIMS .env |
| `DAYS_BACK` | Only migrate last N days (0 = all time) |
| `FOLDERS` | Comma-separated IMAP folder names to migrate |
| `CONCURRENCY` | Accounts to process in parallel (default: 3) |
| `DEST_DOMAIN` | Target domain for dest email derivation (default: danagroup.net) |
