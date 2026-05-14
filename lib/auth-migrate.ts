import { getMigrations } from 'better-auth/db/migration';
import Database from 'better-sqlite3';
import path from 'path';
import { auth } from '~/lib/auth';
import { ConfigService } from '~/services';

const dbPath = path.join(process.cwd(), 'config', 'better_auth.sqlite');

let migrationDone = false;

/**
 * Ensures the better-auth schema exists in SQLite.
 */
export async function ensureSchemaReady(): Promise<void> {
  if (migrationDone) return;
  try {
    const { runMigrations } = await getMigrations(auth.options);
    await runMigrations();
    migrationDone = true;
  } catch (error) {
    console.error('[better-auth] Schema migration error:', error);
  }
}

/**
 * One-time migration script: copies users from users.json into the better-auth
 * SQLite database. Skipped automatically if users already exist in the DB.
 */
export async function migrateUsersFromJson(): Promise<void> {
  await ensureSchemaReady();

  const db = new Database(dbPath);
  try {
    const row = db.prepare('SELECT COUNT(*) as count FROM "user"').get() as { count: number };
    if (row.count > 0) {
      console.log('[better-auth] Users already present, skipping migration.');
      return;
    }

    const users = await ConfigService.getUsersList();
    const now = new Date().toISOString();

    const insertUser = db.prepare(`
      INSERT INTO "user"
        (id, name, email, emailVerified, username, displayUsername, roles, createdAt, updatedAt)
      VALUES
        (@id, @name, @email, @emailVerified, @username, @displayUsername, @roles, @createdAt, @updatedAt)
    `);

    const insertAccount = db.prepare(`
      INSERT INTO account
        (id, accountId, providerId, userId, password, createdAt, updatedAt)
      VALUES
        (@id, @accountId, @providerId, @userId, @password, @createdAt, @updatedAt)
    `);

    const runAll = db.transaction(() => {
      for (const user of users) {
        const userId = user.id.toString();
        // Use placeholder email if empty (better-auth requires a non-empty email)
        const email = user.email || `${user.username}@borgwarehouse.local`;

        insertUser.run({
          id: userId,
          name: user.username,
          email,
          emailVerified: 0,
          username: user.username.toLowerCase(),
          displayUsername: user.username,
          roles: JSON.stringify(user.roles ?? []),
          createdAt: now,
          updatedAt: now,
        });

        insertAccount.run({
          id: `${userId}-credential`,
          accountId: user.username.toLowerCase(),
          providerId: 'credential',
          userId,
          // Re-use the existing bcrypt hash — no re-hashing needed
          password: user.password,
          createdAt: now,
          updatedAt: now,
        });

        console.log(`[better-auth] Migrated user: ${user.username}`);
      }
    });

    runAll();
    console.log('[better-auth] User migration complete.');
  } finally {
    db.close();
  }
}
