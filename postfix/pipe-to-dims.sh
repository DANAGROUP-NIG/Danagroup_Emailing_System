#!/bin/sh
# Postfix pipe transport: reads raw email from stdin, POSTs it to DIMS inbound webhook.
# Called by Postfix for every inbound message destined for @danagroup.net.

set -e

DIMS_API="${DIMS_API_URL:-http://api:8000/api}"
SECRET="${INBOUND_WEBHOOK_SECRET:-}"

# Debug logging
{
  echo "PIPE_DEBUG: SECRET_LEN=${#SECRET}"
  echo "PIPE_DEBUG: DIMS_API_URL=${DIMS_API_URL:-default}"
  echo "PIPE_DEBUG: ENV_HAS_SECRET=$([ -n "$INBOUND_WEBHOOK_SECRET" ] && echo yes || echo no)"
} >> /tmp/pipe-debug.log

TMPFILE=$(mktemp)
cat > "$TMPFILE"

echo "PIPE_DEBUG: BODY_BYTES=$(wc -c < "$TMPFILE")" >> /tmp/pipe-debug.log

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Content-Type: message/rfc822" \
  -H "X-Inbound-Secret: ${SECRET}" \
  --data-binary "@${TMPFILE}" \
  "${DIMS_API}/mail/inbound")

echo "PIPE_DEBUG: HTTP_STATUS=$STATUS" >> /tmp/pipe-debug.log

rm -f "$TMPFILE"

if [ "$STATUS" = "200" ]; then
  exit 0
else
  echo "DIMS inbound webhook returned HTTP ${STATUS}" >&2
  exit 75  # EX_TEMPFAIL — Postfix will retry
fi
