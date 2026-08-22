import { getMigrations } from 'better-auth/db/migration';
import Database from 'better-sqlite3';
import { existsSync, writeFileSync } from 'fs';
import path from 'path';
import { auth } from '~/lib/auth';
import { ConfigService } from '~/services';

const dbPath = path.join(process.cwd(), 'config', 'better_auth.sqlite');
const setupLockFile = path.join(process.cwd(), 'config', '.setup_complete');

/**
 * Creates the setup lock file if it doesn't already exist.
 * Called whenever we confirm that at least one user exists in the database,
 * so that both new installs (via setup wizard) and existing installs
 * (via migration) are equally protected.
 */
function ensureSetupLocked(): void {
  if (!existsSync(setupLockFile)) {
    writeFileSync(setupLockFile, new Date().toISOString());
    console.log('[better-auth] Setup lock file created.');
  }
}

let migrationDone = false;

/**
 * Migrates the `account` table to better-auth 1.7's scoped identity (issuer, accountId).
 * See https://better-auth.com/docs/guides/1-7-upgrade-guide#account-identity-is-scoped-by-issuer
 */
function migrateAccountIdentityToBetterAuth17(db: Database.Database): void {
  const accountTable = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='account'")
    .get();
  if (!accountTable) return; // fresh install, runMigrations creates the full schema

  const columns = db.prepare('PRAGMA table_info(account)').all() as { name: string }[];
  const hasIssuer = columns.some((c) => c.name === 'issuer');

  const run = db.transaction(() => {
    if (!hasIssuer) {
      db.exec('ALTER TABLE account ADD COLUMN issuer TEXT');
    }
    // Fill in rows lacking a valid issuer (idempotent; also repairs partial migrations).
    // Credential accounts: the account subject must be the user id in better-auth 1.7.
    const credential = db
      .prepare(
        "UPDATE account SET issuer = 'local:credential', accountId = userId " +
          "WHERE providerId = 'credential' AND (issuer IS NULL OR issuer = '')"
      )
      .run();
    // OAuth providers (social + generic OIDC) get the synthetic OAuth namespace.
    const providers = db
      .prepare(
        'SELECT DISTINCT providerId FROM account ' +
          "WHERE providerId != 'credential' AND (issuer IS NULL OR issuer = '')"
      )
      .all() as { providerId: string }[];
    const updateIssuer = db.prepare(
      "UPDATE account SET issuer = ? WHERE providerId = ? AND (issuer IS NULL OR issuer = '')"
    );
    let oauth = 0;
    for (const { providerId } of providers) {
      oauth += updateIssuer.run(
        `local:oauth:${encodeURIComponent(providerId)}`,
        providerId
      ).changes;
    }
    return credential.changes + oauth;
  });
  const changed = run();
  if (!hasIssuer || changed > 0) {
    console.log(
      `[better-auth] Migrated account.issuer to better-auth 1.7 scoped identity (${changed} row(s)).`
    );
  }
}

/**
 * Ensures the better-auth schema exists in SQLite.
 */
export async function ensureSchemaReady(): Promise<void> {
  if (migrationDone) return;
  try {
    const db = new Database(dbPath);
    try {
      migrateAccountIdentityToBetterAuth17(db);
    } finally {
      db.close();
    }
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
      // Ensure the setup lock file exists for installs that predate the setup wizard
      ensureSetupLocked();
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
        (id, accountId, providerId, issuer, userId, password, createdAt, updatedAt)
      VALUES
        (@id, @accountId, @providerId, @issuer, @userId, @password, @createdAt, @updatedAt)
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
          accountId: userId,
          providerId: 'credential',
          issuer: 'local:credential',
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

    if (users.length > 0) {
      console.log('[better-auth] User migration complete.');
      ensureSetupLocked();
    } else {
      console.log('[better-auth] No users in users.json, skipping lock file.');
    }
  } finally {
    db.close();
  }
}
