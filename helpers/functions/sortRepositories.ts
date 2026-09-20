import type { Repository } from '~/types';

export type SortOption =
  | 'alias-asc'
  | 'alias-desc'
  | 'status-true'
  | 'status-false'
  | 'append-only-true'
  | 'append-only-false'
  | 'storage-used-asc'
  | 'storage-used-desc'
  | 'last-save-asc'
  | 'last-save-desc';

export function sortRepositories(repoList: Repository[], sortOption: SortOption) {
  const sorted = [...repoList];

  switch (sortOption) {
    case 'alias-asc':
      return sorted.sort((a, b) => a.alias.localeCompare(b.alias));
    case 'alias-desc':
      return sorted.sort((a, b) => b.alias.localeCompare(a.alias));
    case 'status-true':
      return sorted.sort((a, b) => Number(b.status) - Number(a.status));
    case 'status-false':
      return sorted.sort((a, b) => Number(a.status) - Number(b.status));
    case 'append-only-true':
      return sorted.sort(
        (a, b) => Number(Boolean(b.appendOnlyMode)) - Number(Boolean(a.appendOnlyMode))
      );
    case 'append-only-false':
      return sorted.sort(
        (a, b) => Number(Boolean(a.appendOnlyMode)) - Number(Boolean(b.appendOnlyMode))
      );
    case 'storage-used-asc':
      return sorted.sort((a, b) => {
        const aRatio = a.storageSize ? a.storageUsed / a.storageSize : 0;
        const bRatio = b.storageSize ? b.storageUsed / b.storageSize : 0;
        return aRatio - bRatio;
      });
    case 'storage-used-desc':
      return sorted.sort((a, b) => {
        const aRatio = a.storageSize ? a.storageUsed / a.storageSize : 0;
        const bRatio = b.storageSize ? b.storageUsed / b.storageSize : 0;
        return bRatio - aRatio;
      });
    case 'last-save-asc':
      return sorted.sort((a, b) => {
        const aDate = a.lastSave ? new Date(a.lastSave).getTime() : 0;
        const bDate = b.lastSave ? new Date(b.lastSave).getTime() : 0;
        return aDate - bDate;
      });
    case 'last-save-desc':
      return sorted.sort((a, b) => {
        const aDate = a.lastSave ? new Date(a.lastSave).getTime() : 0;
        const bDate = b.lastSave ? new Date(b.lastSave).getTime() : 0;
        return bDate - aDate;
      });
    default:
      return sorted;
  }
}
