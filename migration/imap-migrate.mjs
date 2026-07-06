/**
 * imap-migrate.mjs
 * Migrates a single user's mailbox from a source IMAP server into DIMS
 * via the inbound webhook endpoint.
 *
 * Usage:
 *   SOURCE_IMAP_USER=alice@danagroup.com SOURCE_IMAP_PASS=secret node imap-migrate.mjs
 *
 * The script:
 *  1. Connects to the source IMAP server
 *  2. Iterates each configured folder
 *  3. Fetches all messages (or those within DAYS_BACK days)
 *  4. POSTs each raw RFC 2822 message to POST /api/mail/inbound
 *  5. Reports counts and errors
 */

import 'dotenv/config';
import imaps from 'imap-simple';
import chalk from 'chalk';

const {
  SOURCE_IMAP_HOST,
  SOURCE_IMAP_PORT = '993',
  SOURCE_IMAP_TLS = 'true',
  SOURCE_IMAP_USER,
  SOURCE_IMAP_PASS,
  DIMS_API_URL = 'http://localhost:8000/api',
  INBOUND_WEBHOOK_SECRET = '',
  DAYS_BACK = '0',
  FOLDERS = 'INBOX,Sent,Drafts,Trash',
} = process.env;

if (!SOURCE_IMAP_USER || !SOURCE_IMAP_PASS) {
  console.error(chalk.red('ERROR: SOURCE_IMAP_USER and SOURCE_IMAP_PASS are required'));
  process.exit(1);
}

const folders = FOLDERS.split(',').map(f => f.trim()).filter(Boolean);
const daysBack = parseInt(DAYS_BACK, 10);

async function postToWebhook(rawMessage) {
  const url = `${DIMS_API_URL}/mail/inbound`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'message/rfc822',
      ...(INBOUND_WEBHOOK_SECRET ? { 'X-Inbound-Secret': INBOUND_WEBHOOK_SECRET } : {}),
    },
    body: rawMessage,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
}

async function migrateFolder(connection, folderName) {
  let openedFolder;
  try {
    openedFolder = await connection.openBox(folderName);
  } catch {
    console.warn(chalk.yellow(`  [SKIP] Folder "${folderName}" not found on source`));
    return { migrated: 0, failed: 0, skipped: 0 };
  }

  const searchCriteria = ['ALL'];
  if (daysBack > 0) {
    const since = new Date();
    since.setDate(since.getDate() - daysBack);
    searchCriteria.push(['SINCE', since]);
  }

  const fetchOptions = { bodies: [''], markSeen: false };
  const messages = await connection.search(searchCriteria, fetchOptions);

  console.log(chalk.cyan(`  [${folderName}] Found ${messages.length} messages`));

  let migrated = 0, failed = 0;

  for (const msg of messages) {
    const raw = msg.parts?.[0]?.body;
    if (!raw) { failed++; continue; }

    try {
      await postToWebhook(raw);
      migrated++;
      if (migrated % 50 === 0) {
        process.stdout.write(chalk.green(`    ✓ ${migrated}/${messages.length}\r`));
      }
    } catch (err) {
      failed++;
      if (failed <= 5) {
        console.error(chalk.red(`    [FAIL] UID ${msg.attributes?.uid}: ${err.message}`));
      }
    }
  }

  console.log(chalk.green(`  [${folderName}] Done — ${migrated} migrated, ${failed} failed`));
  return { migrated, failed, skipped: 0 };
}

async function main() {
  console.log(chalk.bold(`\nDIMS IMAP Migration`));
  console.log(`User  : ${chalk.cyan(SOURCE_IMAP_USER)}`);
  console.log(`Source: ${SOURCE_IMAP_HOST}:${SOURCE_IMAP_PORT}`);
  console.log(`Dest  : ${DIMS_API_URL}/mail/inbound`);
  console.log(`Folders: ${folders.join(', ')}`);
  if (daysBack > 0) console.log(`Date range: last ${daysBack} days`);
  console.log('');

  const config = {
    imap: {
      user: SOURCE_IMAP_USER,
      password: SOURCE_IMAP_PASS,
      host: SOURCE_IMAP_HOST,
      port: parseInt(SOURCE_IMAP_PORT, 10),
      tls: SOURCE_IMAP_TLS !== 'false',
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
    },
  };

  let connection;
  try {
    connection = await imaps.connect(config);
    console.log(chalk.green('✓ Connected to source IMAP'));
  } catch (err) {
    console.error(chalk.red(`✗ IMAP connection failed: ${err.message}`));
    process.exit(1);
  }

  const totals = { migrated: 0, failed: 0 };

  for (const folder of folders) {
    const result = await migrateFolder(connection, folder);
    totals.migrated += result.migrated;
    totals.failed += result.failed;
  }

  connection.end();

  console.log(chalk.bold('\n── Summary ──────────────────────'));
  console.log(`  Total migrated : ${chalk.green(totals.migrated)}`);
  console.log(`  Total failed   : ${totals.failed > 0 ? chalk.red(totals.failed) : chalk.green(0)}`);
  console.log('');

  process.exit(totals.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(chalk.red('Fatal:', err.message));
  process.exit(1);
});
