#!/bin/sh
# Post-init script for boky/postfix.
# Adds the DIMS pipe transport to master.cf, builds lookup DBs,
# and overrides settings that boky/postfix resets after POSTFIX_* env processing.
set -e

if ! grep -qE "^dims[[:space:]]+unix" /etc/postfix/master.cf; then
  echo "Registering DIMS pipe transport in Postfix master.cf..."
  cat >> /etc/postfix/master.cf <<'EOF'

dims     unix  -       n       n       -       -       pipe
  flags=Rq user=nobody argv=/usr/local/bin/pipe-to-dims.sh
EOF
fi

if [ -f /etc/postfix/transport ]; then
  echo "Building transport map database in writable volume..."
  cp /etc/postfix/transport /var/spool/postfix/transport
  postmap /var/spool/postfix/transport
  postconf -e "transport_maps=lmdb:/var/spool/postfix/transport"
fi

# Build the aliases LMDB database — boky/postfix sets alias_maps=lmdb:/etc/aliases
# but only ships /etc/aliases.db (Berkeley DB). Without the LMDB file, any lookup
# that touches alias_maps (e.g. via local_recipient_maps) fails with:
#   "open database /etc/aliases.lmdb: No such file or directory"
echo "Building aliases LMDB database..."
postalias lmdb:/etc/aliases

# Force local_recipient_maps empty — the boky/postfix image resets this to its
# default (proxy:unix:passwd.byname $alias_maps) after processing POSTFIX_* env vars.
# We need it empty so Postfix accepts ALL @danagroup.net recipients and pipes them
# to DIMS via the transport map, rather than checking against /etc/passwd.
echo "Clearing local_recipient_maps (accept all @danagroup.net recipients)..."
postconf -e "local_recipient_maps="

