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
echo "Clearing local_recipient_maps (accept all recipients across all Dana Group domains)..."
postconf -e "local_recipient_maps="

# ── NDR / Bounce routing ───────────────────────────────────────────────────
# Route Postfix's own bounce/DSN notifications through the dims pipe so that
# async delivery failures (e.g. 550 User Unknown from remote MTA) are piped
# into the DIMS inbound webhook and converted to NDR messages in the inbox.
#
# When Postfix cannot deliver a message it generates a DSN email and attempts
# to deliver it to the original sender (return-path). Since all @danagroup.net
# addresses use the dims transport, the DSN will automatically route through
# the pipe-to-dims.sh script and reach InboundMailService.processRaw(), which
# now has a DSN detector that calls processDsn() to create the NDR.
#
# No additional config is needed — the transport_maps entry for danagroup.net
# already catches the bounce because the DSN is addressed to the original sender
# (an @danagroup.net user). Setting notify_classes ensures Postfix notifies on
# all bounce types.
echo "Configuring Postfix bounce/DSN notification classes..."
postconf -e "notify_classes=bounce, 2bounce, delay, policy, protocol, resource, software"
postconf -e "bounce_notice_recipient=postmaster@danagroup.net"
postconf -e "2bounce_notice_recipient=postmaster@danagroup.net"

