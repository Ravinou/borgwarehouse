/**
 * Optional manual migration script >>> for debugging purposes only.
 *
 * The migration from next-auth to better-auth runs automatically at server
 * startup via instrumentation.ts. You do NOT need to run this script in
 * normal usage.
 *
 * Use it only if you need to manually trigger or debug the migration:
 *   pnpm tsx scripts/migrate-users.ts
 *
 * The script is idempotent: if users already exist in the SQLite database
 * it exits without making any changes.
 */
import { migrateUsersFromJson } from '../lib/auth-migrate';

migrateUsersFromJson()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
