import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'config', 'better_auth.sqlite');

/**
 * Sync helpers: keep the better-auth SQLite DB in step with users.json
 * after account mutations. These are synchronous (better-sqlite3 API).
 */

export function syncUsernameChange(userId: string, newUsername: string): void {
  const db = new Database(dbPath);
  try {
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE "user" SET name=?, username=?, displayUsername=?, updatedAt=? WHERE id=?`
    ).run(newUsername, newUsername.toLowerCase(), newUsername, now, userId);
    db.prepare(
      `UPDATE account SET accountId=?, updatedAt=? WHERE userId=? AND providerId='credential'`
    ).run(newUsername.toLowerCase(), now, userId);
  } finally {
    db.close();
  }
}

export function syncPasswordChange(userId: string, newPasswordHash: string): void {
  const db = new Database(dbPath);
  try {
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE account SET password=?, updatedAt=? WHERE userId=? AND providerId='credential'`
    ).run(newPasswordHash, now, userId);
  } finally {
    db.close();
  }
}

export function syncEmailChange(userId: string, newEmail: string): void {
  const db = new Database(dbPath);
  try {
    const now = new Date().toISOString();
    db.prepare(`UPDATE "user" SET email=?, updatedAt=? WHERE id=?`).run(newEmail, now, userId);
  } finally {
    db.close();
  }
}
