import Database from 'better-sqlite3';
import { dropLegacyAccountIssuer } from './auth-legacy-schema';

// Schema created by better-auth 1.7.2 (BorgWarehouse 3.6.x fresh installs)
const LEGACY_SCHEMA = `
  CREATE TABLE "account" ("id" text not null primary key, "issuer" text not null, "accountId" text not null, "providerId" text not null, "userId" text not null, "password" text, "createdAt" date not null, "updatedAt" date not null);
  CREATE INDEX "account_userId_idx" on "account" ("userId");
  CREATE UNIQUE INDEX "account_issuer_accountId_uidx" on "account" ("issuer", "accountId");
`;

const columnsOf = (db: Database.Database) =>
  (db.prepare('PRAGMA table_info(account)').all() as { name: string }[]).map((c) => c.name);
const indexesOf = (db: Database.Database) =>
  (db.prepare('PRAGMA index_list(account)').all() as { name: string }[]).map((i) => i.name);

describe('dropLegacyAccountIssuer', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
  });
  afterEach(() => db.close());

  it('drops the issuer column and its index while keeping existing accounts', () => {
    db.exec(LEGACY_SCHEMA);
    db.prepare(
      "INSERT INTO account VALUES ('0-credential', 'local:credential', '0', 'credential', '0', 'hash', 'now', 'now')"
    ).run();

    dropLegacyAccountIssuer(db);

    expect(columnsOf(db)).not.toContain('issuer');
    expect(indexesOf(db)).not.toContain('account_issuer_accountId_uidx');
    expect(indexesOf(db)).toContain('account_userId_idx');
    expect(db.prepare('SELECT accountId, providerId, password FROM account').all()).toEqual([
      { accountId: '0', providerId: 'credential', password: 'hash' },
    ]);
    // New rows no longer need an issuer
    db.prepare(
      "INSERT INTO account (id, accountId, providerId, userId, createdAt, updatedAt) VALUES ('1', 'sub', 'oidc', '0', 'now', 'now')"
    ).run();

    // Idempotent
    expect(() => dropLegacyAccountIssuer(db)).not.toThrow();
  });

  it('does nothing on a fresh database without an account table', () => {
    expect(() => dropLegacyAccountIssuer(db)).not.toThrow();
    expect(columnsOf(db)).toEqual([]);
  });
});
