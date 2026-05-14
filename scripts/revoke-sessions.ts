/**
 * CLI script to revoke all active sessions, forcing every user to log in again.
 * Useful after a security incident, password change, or suspected compromise.
 *
 * Usage:
 *   pnpm revoke:sessions
 *
 * Docker:
 *   docker exec borgwarehouse pnpm --dir /home/borgwarehouse/app revoke:sessions
 */
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'config', 'better_auth.sqlite');

export function run(): void {
  let db: InstanceType<typeof Database>;
  try {
    db = new Database(dbPath);
  } catch {
    console.error('[revoke-sessions] Cannot open config/better_auth.sqlite.');
    console.error('  Make sure BorgWarehouse has been started at least once.');
    process.exit(1);
    return;
  }

  try {
    const { changes } = db.prepare('DELETE FROM session').run();
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║       BorgWarehouse — Sessions Revoked           ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Sessions deleted : ${String(changes).padEnd(29)}║`);
    console.log('║                                                  ║');
    console.log('║  All users must log in again.                    ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
  } finally {
    db.close();
  }
}

if (!process.env.VITEST) {
  run();
}
