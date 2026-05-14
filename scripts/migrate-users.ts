/**
 * One-time migration script: copies users from config/users.json into the
 * better-auth SQLite database (config/better_auth.sqlite).
 *
 * Run once when upgrading from next-auth to better-auth:
 *   pnpm tsx scripts/migrate-users.ts
 *
 * My script is idempotent: if users already exist in the database it exits
 * without making any changes.
 */
import { migrateUsersFromJson } from '../lib/auth-migrate';

migrateUsersFromJson()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
