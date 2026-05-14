import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'config', 'better_auth.sqlite');

/**
 * Returns the number of users in the better-auth SQLite database.
 * Returns 0 if the database does not exist yet (genuine fresh install).
 */
export function getSqliteUserCount(): number {
  try {
    const db = new Database(dbPath, { readonly: true });
    try {
      const row = db.prepare('SELECT COUNT(*) as count FROM "user"').get() as {
        count: number;
      };
      return row.count;
    } finally {
      db.close();
    }
  } catch {
    return 0;
  }
}

/**
 * Updates the password hash for a user in the SQLite account table.
 * Silently no-ops if the database does not exist yet (fresh install).
 */
export function updateSqlitePassword(userId: string, newHash: string): void {
  try {
    const db = new Database(dbPath);
    try {
      const now = new Date().toISOString();
      db.prepare(
        `UPDATE account SET password=?, updatedAt=? WHERE userId=? AND providerId='credential'`
      ).run(newHash, now, userId);
    } finally {
      db.close();
    }
  } catch {
    // SQLite not yet created — users.json update is enough.
  }
}
