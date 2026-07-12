#!/bin/bash
set -e

# ── Inject env vars into Dovecot SQL configs at runtime ──────────────────────
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-dims_db}"
DB_USER="${DB_USER:-dims_user}"
DB_PASS="${DB_PASS:-}"
MAIL_DOMAIN="${MAIL_DOMAIN:-danagroup.net}"

sed -i \
  -e "s|__DB_HOST__|${DB_HOST}|g" \
  -e "s|__DB_PORT__|${DB_PORT}|g" \
  -e "s|__DB_NAME__|${DB_NAME}|g" \
  -e "s|__DB_USER__|${DB_USER}|g" \
  -e "s|__DB_PASS__|${DB_PASS}|g" \
  -e "s|__MAIL_DOMAIN__|${MAIL_DOMAIN}|g" \
  /etc/dovecot/dovecot-sql.conf.ext \
  /etc/dovecot/dovecot-dict-sql.conf.ext

# ── TLS cert handling ─────────────────────────────────────────────────────────
CERT_DIR="/etc/dovecot/certs"
if [ -f "${CERT_DIR}/fullchain.pem" ] && [ -f "${CERT_DIR}/privkey.pem" ]; then
  echo "Using provided TLS certificates."
  sed -i \
    -e "s|ssl_cert =.*|ssl_cert = <${CERT_DIR}/fullchain.pem|" \
    -e "s|ssl_key =.*|ssl_key = <${CERT_DIR}/privkey.pem|" \
    /etc/dovecot/conf.d/10-ssl.conf
else
  echo "No TLS certs found at ${CERT_DIR} — using self-signed cert (dev only)."
  if [ ! -f "/etc/dovecot/certs/dovecot-self.pem" ]; then
    mkdir -p /etc/dovecot/certs
    openssl req -x509 -newkey rsa:2048 -keyout /etc/dovecot/certs/dovecot-self-key.pem \
      -out /etc/dovecot/certs/dovecot-self.pem -days 3650 -nodes \
      -subj "/CN=mail.${MAIL_DOMAIN}" 2>/dev/null
  fi
  sed -i \
    -e "s|ssl_cert =.*|ssl_cert = </etc/dovecot/certs/dovecot-self.pem|" \
    -e "s|ssl_key =.*|ssl_key = </etc/dovecot/certs/dovecot-self-key.pem|" \
    /etc/dovecot/conf.d/10-ssl.conf
fi

# ── Ensure mail dir exists ────────────────────────────────────────────────────
mkdir -p /var/mail/vhosts

# ── Create vmail system user if missing ──────────────────────────────────────
if ! id -u vmail &>/dev/null; then
  groupadd -g 5000 vmail
  useradd -u 5000 -g vmail -s /sbin/nologin -d /var/mail vmail
fi
chown -R vmail:vmail /var/mail

exec dovecot -F
