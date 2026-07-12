FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    dovecot-core \
    dovecot-imapd \
    dovecot-pop3d \
    dovecot-pgsql \
    && rm -rf /var/lib/apt/lists/*

COPY conf/ /etc/dovecot/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# IMAPS (993) and POP3S (995)
EXPOSE 993 995

VOLUME ["/var/mail", "/etc/dovecot/certs"]

ENTRYPOINT ["/entrypoint.sh"]
