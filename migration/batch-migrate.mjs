/**
 * batch-migrate.mjs
 * Reads a CSV of accounts and migrates them all in parallel (up to CONCURRENCY).
 *
 * accounts.csv format (no header row):
 *   source_email,source_password[,dest_email]
 *
 * dest_email is optional — defaults to source_email with domain replaced by DEST_DOMAIN
 *
 * Usage:
 *   node batch-migrate.mjs [accounts.csv]
 */

import 'dotenv/config';
import { readFileSync, appendFileSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import pLimit from 'p-limit';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const {
  CONCURRENCY = '3',
  SOURCE_IMAP_HOST,
  DEST_DOMAIN = 'danagroup.net',
} = process.env;

const csvPath = process.argv[2] ?? path.join(__dirname, 'accounts.csv');
const reportPath = path.join(__dirname, `migration-report-${Date.now()}.csv`);

function parseAccounts(csvPath) {
  const raw = readFileSync(csvPath, 'utf8');
  return raw.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map((line, i) => {
      const [srcEmail, srcPass, destEmail] = line.split(',').map(s => s.trim());
      if (!srcEmail || !srcPass) {
        console.warn(chalk.yellow(`[WARN] Line ${i + 1}: skipping malformed entry`));
        return null;
      }
      const resolvedDest = destEmail ?? srcEmail.replace(/@.+$/, `@${DEST_DOMAIN}`);
      return { srcEmail, srcPass, destEmail: resolvedDest };
    })
    .filter(Boolean);
}

async function migrateAccount({ srcEmail, srcPass, destEmail }) {
  const start = Date.now();
  console.log(chalk.cyan(`→ Migrating ${srcEmail} → ${destEmail}`));

  const env = {
    ...process.env,
    SOURCE_IMAP_USER: srcEmail,
    SOURCE_IMAP_PASS: srcPass,
  };

  const result = spawnSync('node', [path.join(__dirname, 'imap-migrate.mjs')], {
    env,
    encoding: 'utf8',
    timeout: 30 * 60 * 1000, // 30 min max per account
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const success = result.status === 0;

  if (success) {
    console.log(chalk.green(`✓ ${srcEmail} — done in ${elapsed}s`));
  } else {
    console.error(chalk.red(`✗ ${srcEmail} — FAILED in ${elapsed}s`));
    if (result.stderr) console.error(chalk.red('  ' + result.stderr.slice(0, 500)));
  }

  return {
    srcEmail,
    destEmail,
    success,
    elapsed,
    stdout: result.stdout?.slice(-500) ?? '',
    stderr: result.stderr?.slice(-300) ?? '',
  };
}

async function main() {
  let accounts;
  try {
    accounts = parseAccounts(csvPath);
  } catch (err) {
    console.error(chalk.red(`Cannot read accounts CSV at ${csvPath}: ${err.message}`));
    console.error('Create accounts.csv with lines: source_email,source_password');
    process.exit(1);
  }

  console.log(chalk.bold(`\nDIMS Batch Migration`));
  console.log(`Accounts  : ${chalk.cyan(accounts.length)}`);
  console.log(`Source    : ${SOURCE_IMAP_HOST}`);
  console.log(`Report    : ${reportPath}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log('');

  writeFileSync(reportPath, 'srcEmail,destEmail,success,elapsedSeconds,notes\n');

  const limit = pLimit(parseInt(CONCURRENCY, 10));
  const results = await Promise.all(
    accounts.map(acc => limit(() => migrateAccount(acc)))
  );

  for (const r of results) {
    appendFileSync(reportPath,
      `${r.srcEmail},${r.destEmail},${r.success},${r.elapsed},"${r.stderr.replace(/"/g, "'")}"\n`
    );
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.length - succeeded;

  console.log(chalk.bold('\n── Batch Summary ─────────────────'));
  console.log(`  Total     : ${results.length}`);
  console.log(`  Succeeded : ${chalk.green(succeeded)}`);
  console.log(`  Failed    : ${failed > 0 ? chalk.red(failed) : chalk.green(0)}`);
  console.log(`  Report    : ${reportPath}`);
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(chalk.red('Fatal:', err.message));
  process.exit(1);
});
