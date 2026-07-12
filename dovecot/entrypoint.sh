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
  echo "Using provided TLS certificates from ${CERT_DIR}."
  CERT_FILE="${CERT_DIR}/fullchain.pem"
  KEY_FILE="${CERT_DIR}/privkey.pem"
else
  echo "No TLS certs found at ${CERT_DIR} — generating self-signed cert (dev only)."
  # Write to /run (tmpfs, not a volume mount) so it persists within this container instance
  CERT_FILE="/run/dovecot-self.pem"
  KEY_FILE="/run/dovecot-self-key.pem"
  openssl req -x509 -newkey rsa:2048 -keyout "${KEY_FILE}" \
    -out "${CERT_FILE}" -days 3650 -nodes \
    -subj "/CN=mail.${MAIL_DOMAIN}" 2>/dev/null
  echo "Self-signed cert generated."
fi

# Write ssl config directly (avoids sed escaping issues with < character)
cat > /etc/dovecot/conf.d/10-ssl.conf <<SSLEOF
ssl = required
ssl_cert = <${CERT_FILE}
ssl_key = <${KEY_FILE}
ssl_min_protocol = TLSv1.2
ssl_prefer_server_ciphers = yes
SSLEOF

# ── Ensure mail dir exists ────────────────────────────────────────────────────
mkdir -p /var/mail/vhosts

# ── Create vmail system user if missing ──────────────────────────────────────
if ! id -u vmail &>/dev/null; then
  groupadd -g 5000 vmail
  useradd -u 5000 -g vmail -s /sbin/nologin -d /var/mail vmail
fi
chown -R vmail:vmail /var/mail
# Allow the API container (different user) to write into vhosts subdirectories
chmod 777 /var/mail/vhosts

exec dovecot -F
