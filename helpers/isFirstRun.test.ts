import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('~/services');
vi.mock('~/helpers/sqlite-utils');

import { existsSync } from 'fs';
import { ConfigService } from '~/services';
import { getSqliteUserCount } from '~/helpers/sqlite-utils';
import { isFirstRun } from '~/helpers/isFirstRun';

describe('isFirstRun()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([]);
    vi.mocked(getSqliteUserCount).mockReturnValue(0);
  });

  it('returns false immediately when lock file exists', async () => {
    vi.mocked(existsSync).mockReturnValue(true);

    const result = await isFirstRun();

    expect(result).toBe(false);
    expect(ConfigService.getUsersList).not.toHaveBeenCalled();
    expect(getSqliteUserCount).not.toHaveBeenCalled();
  });

  it('returns false when users.json has users (no lock file)', async () => {
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      { id: 1, username: 'admin', email: '', password: 'hash', roles: ['admin'] },
    ]);

    const result = await isFirstRun();

    expect(result).toBe(false);
    expect(getSqliteUserCount).not.toHaveBeenCalled();
  });

  it('returns false when users.json is empty but SQLite has users (corruption protection)', async () => {
    vi.mocked(getSqliteUserCount).mockReturnValue(3);

    const result = await isFirstRun();

    expect(result).toBe(false);
  });

  it('returns true when users.json is empty and SQLite has no users (genuine fresh install)', async () => {
    vi.mocked(getSqliteUserCount).mockReturnValue(0);

    const result = await isFirstRun();

    expect(result).toBe(true);
  });

  it('returns true when SQLite does not exist yet (getSqliteUserCount returns 0)', async () => {
    // getSqliteUserCount handles the file-not-found case internally and returns 0
    vi.mocked(getSqliteUserCount).mockReturnValue(0);

    const result = await isFirstRun();

    expect(result).toBe(true);
  });
});
