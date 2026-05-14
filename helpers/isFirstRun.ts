import { existsSync } from 'fs';
import path from 'path';
import { ConfigService } from '~/services';
import { getSqliteUserCount } from '~/helpers/sqlite-utils';

export const setupLockFile = path.join(process.cwd(), 'config', '.setup_complete');

/**
 * Returns true only when ALL three sources agree there are no users:
 *   - lock file does not exist, AND
 *   - users.json is empty, AND
 *   - SQLite has no users (or doesn't exist yet)
 *
 * The lock file is the strongest guard: once setup is done it is never
 * automatically deleted, so even a simultaneous wipe of both databases
 * cannot re-open the setup page.
 */
export async function isFirstRun(): Promise<boolean> {
  if (existsSync(setupLockFile)) return false;

  const users = await ConfigService.getUsersList();
  if (users.length > 0) return false;

  return getSqliteUserCount() === 0;
}
