import cron from 'node-cron';
import { spawn } from 'child_process';
import path from 'path';

// Local testing scheduler: re-runs the stock sync on an interval so you can
// watch stock/price changes propagate to the dev DB without triggering it by hand.
// Default: every 5 minutes. Pass a cron expression as the first arg to override,
// e.g. `npx tsx scripts/blueberry-scheduler.ts "*/1 * * * *"` for every minute.
const CRON_EXPR = process.argv[2] || '*/5 * * * *';

function runSync() {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ── Running Blueberry stock sync ──`);

  const child = spawn('npx', ['tsx', path.join(__dirname, 'blueberry-stock-sync.ts')], {
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code) => {
    console.log(`[${new Date().toISOString()}] Sync process exited with code ${code}`);
  });
}

console.log(`Blueberry local scheduler started. Cron: "${CRON_EXPR}"`);
console.log('Running an initial sync now, then on schedule...\n');
runSync();

cron.schedule(CRON_EXPR, runSync);
