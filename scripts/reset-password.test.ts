import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  hashSync: vi.fn(() => '$2b$10$fakehashfakehashfakehash'),
}));

vi.mock('crypto', () => ({
  randomBytes: vi.fn((n: number) => Buffer.alloc(n, 0)),
}));

vi.mock('../helpers/sqlite-utils');

import { readFileSync, writeFileSync } from 'fs';
import { updateSqlitePassword } from '../helpers/sqlite-utils';
import { generatePassword, run } from '~/scripts/reset-password';

const ADMIN_USER = { id: 1, username: 'admin', roles: ['admin'], password: 'oldhash', email: '' };
const REGULAR_USER = { id: 2, username: 'user', roles: ['user'], password: 'oldhash', email: '' };

describe('generatePassword()', () => {
  it('returns a string of exactly 20 characters', () => {
    const pwd = generatePassword();
    expect(pwd).toHaveLength(20);
  });

  it('only contains characters from the allowed set (no ambiguous chars)', () => {
    const allowed = /^[abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/;
    for (let i = 0; i < 10; i++) {
      expect(generatePassword()).toMatch(allowed);
    }
  });
});

describe('run()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(updateSqlitePassword).mockImplementation(() => {});
  });

  it('exits with code 1 when users.json cannot be read', () => {
    vi.mocked(readFileSync).mockImplementation(() => { throw new Error('ENOENT'); });

    run();

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Cannot read config/users.json'));
  });

  it('exits with code 1 when no admin user is found', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify([REGULAR_USER]));

    run();

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('No admin user found'));
  });

  it('updates users.json with the new password hash on success', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify([ADMIN_USER]));

    run();

    expect(writeFileSync).toHaveBeenCalledOnce();
    const [filePath, content] = vi.mocked(writeFileSync).mock.calls[0];
    expect(filePath).toContain('users.json');
    const saved = JSON.parse(content as string);
    expect(saved[0].password).toBe('$2b$10$fakehashfakehashfakehash');
  });

  it('calls updateSqlitePassword with the new hash and admin id', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify([ADMIN_USER]));

    run();

    expect(updateSqlitePassword).toHaveBeenCalledWith('1', '$2b$10$fakehashfakehashfakehash');
  });

  it('prints the username and new password in the output', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify([ADMIN_USER]));

    run();

    const allLogs = vi.mocked(console.log).mock.calls.flat().join('\n');
    expect(allLogs).toContain('admin');
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('only resets the admin password when multiple users exist', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify([REGULAR_USER, ADMIN_USER]));

    run();

    const [, content] = vi.mocked(writeFileSync).mock.calls[0];
    const saved = JSON.parse(content as string);
    expect(saved[0].password).toBe('oldhash');
    expect(saved[1].password).toBe('$2b$10$fakehashfakehashfakehash');
  });
});
