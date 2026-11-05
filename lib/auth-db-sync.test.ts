import Database from 'better-sqlite3';
import { getCredentialPasswordHashFromDb } from './auth-db-sync';

describe('getCredentialPasswordHashFromDb', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec('CREATE TABLE account (userId TEXT, providerId TEXT, password TEXT)');
    db.prepare('INSERT INTO account VALUES (?, ?, ?)').run('1', 'credential', 'sqlite-hash');
    db.prepare('INSERT INTO account VALUES (?, ?, ?)').run('2', 'google', 'oauth-hash');
  });
  afterEach(() => db.close());

  it('reads the password from the user credential account only', () => {
    expect(getCredentialPasswordHashFromDb(db, '1')).toBe('sqlite-hash');
    expect(getCredentialPasswordHashFromDb(db, '2')).toBeUndefined();
    expect(getCredentialPasswordHashFromDb(db, '3')).toBeUndefined();
  });
});
