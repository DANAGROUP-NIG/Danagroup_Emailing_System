#!/bin/sh
# Post-init script for boky/postfix.
# Adds the DIMS pipe transport to master.cf and builds the transport map DB.
set -e

if ! grep -qE "^dims[[:space:]]+unix" /etc/postfix/master.cf; then
  echo "Registering DIMS pipe transport in Postfix master.cf..."
  cat >> /etc/postfix/master.cf <<'EOF'

dims     unix  -       n       n       -       -       pipe
  flags=Rq user=nobody argv=/usr/local/bin/pipe-to-dims.sh
EOF
fi

if [ -f /etc/postfix/transport ]; then
  echo "Building transport map database..."
  postmap /etc/postfix/transport
fi
