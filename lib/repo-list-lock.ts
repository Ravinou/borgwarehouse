import { Mutex } from 'async-mutex';
import { ConfigService } from '~/services';
import { Repository } from '~/types';

// Serializes every read-modify-write cycle on repo.json, together with the
// authorized_keys edits done by the shell scripts in between. Without it,
// concurrent requests overwrite each other's changes.
// Stored on globalThis so that every API route bundle shares the same lock.
const globalForLock = globalThis as typeof globalThis & { __bwRepoListMutex?: Mutex };
const repoListMutex = (globalForLock.__bwRepoListMutex ??= new Mutex());

export function withRepoListLock<T>(fn: () => Promise<T>): Promise<T> {
  return repoListMutex.runExclusive(fn);
}

// For long scans (status, storage) run outside the lock: re-read repo.json under
// the lock and only apply the given fields, so repositories created, edited or
// deleted during the scan are kept as they are.
export async function persistRepoFields<K extends keyof Repository>(
  computedRepoList: Repository[],
  fields: K[]
): Promise<void> {
  await withRepoListLock(async () => {
    const computedByName = new Map(computedRepoList.map((repo) => [repo.repositoryName, repo]));
    const currentRepoList = await ConfigService.getRepoList();
    const mergedRepoList = currentRepoList.map((repo) => {
      const computed = computedByName.get(repo.repositoryName);
      if (!computed) return repo;
      const merged = { ...repo };
      for (const field of fields) {
        merged[field] = computed[field];
      }
      return merged;
    });
    await ConfigService.updateRepoList(mergedRepoList);
  });
}
