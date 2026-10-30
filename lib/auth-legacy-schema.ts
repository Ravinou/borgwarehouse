import type Database from 'better-sqlite3';

/**
 * Removes the `account.issuer` column introduced by better-auth 1.7.0 through 1.7.2
 * (BorgWarehouse 3.6.2 → 3.7.0). better-auth >= 1.7.3 identifies accounts by
 * (providerId, accountId) again and never writes `issuer`, so a leftover NOT NULL
 * column breaks every insert and makes better-auth's schema check fail.
 * See https://better-auth.com/docs/guides/1-7-upgrade-guide#account-identity-keeps-the-provider-key
 *
 * Must run synchronously before `betterAuth()` is created: better-auth caches a
 * schema mismatch and only clears it when its own migrations apply changes.
 */
export function dropLegacyAccountIssuer(db: Database.Database): void {
  const columns = db.prepare('PRAGMA table_info(account)').all() as { name: string }[];
  if (!columns.some((c) => c.name === 'issuer')) return;

  const quote = (identifier: string) => `"${identifier.replace(/"/g, '""')}"`;

  db.transaction(() => {
    // SQLite refuses to drop a column still referenced by an index
    // (e.g. account_issuer_accountId_uidx), so drop those indexes first.
    const indexes = db.prepare('PRAGMA index_list(account)').all() as { name: string }[];
    for (const { name } of indexes) {
      const indexColumns = db.prepare(`PRAGMA index_info(${quote(name)})`).all() as {
        name: string | null;
      }[];
      if (indexColumns.some((c) => c.name === 'issuer')) {
        db.exec(`DROP INDEX ${quote(name)}`);
      }
    }
    db.exec('ALTER TABLE account DROP COLUMN issuer');
  })();

  console.log('[better-auth] Removed legacy account.issuer column (better-auth >= 1.7.3).');
}
