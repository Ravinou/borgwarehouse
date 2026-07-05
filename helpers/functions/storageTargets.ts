import { StorageTarget } from '~/types';

// Parse the STORAGE_TARGETS environment variable into its raw list of entries.
// It holds a comma-separated list of already-mounted external storages (e.g. an
// SSHFS-mounted Hetzner Storage Box) where repositories can be stored through a
// per-repository symbolic link created by BorgWarehouse.
// Each entry is an absolute path with an optional display name using the
// `path|name` syntax:
//   STORAGE_TARGETS="/mnt/hetzner|Hetzner Box,/mnt/nas"
const getStorageTargetEntries = (): string[] => {
  return (process.env.STORAGE_TARGETS ?? '')
    .split(',')
    .map((target) => target.trim())
    .filter((target) => target.length > 0);
};

// Extract the mount path from a raw entry, dropping any `|name` display label.
const parsePath = (entry: string): string => entry.split('|')[0].trim();

// Return only the mount paths. This is the security-relevant list: it is what
// createRepo.sh receives and what isValidStorageTarget checks against. The
// optional display names never take part in validation.
export const getStorageTargets = (): string[] => {
  return getStorageTargetEntries()
    .map(parsePath)
    .filter((path) => path.length > 0);
};

// Return each target as { path, name } for the UI. `name` is the label declared
// after `|` (trimmed) when present, otherwise it falls back to the raw path.
export const getStorageTargetsWithNames = (): StorageTarget[] => {
  return getStorageTargetEntries()
    .map((entry) => {
      const path = parsePath(entry);
      const name = entry.slice(entry.indexOf('|') + 1).trim();
      const hasName = entry.includes('|') && name.length > 0;
      return { path, name: hasName ? name : path };
    })
    .filter((target) => target.path.length > 0);
};

// A storage target is only valid if it is an absolute path present in the
// admin-defined allowlist (STORAGE_TARGETS). This prevents path traversal and
// writing repositories to arbitrary locations.
export const isValidStorageTarget = (target: string): boolean => {
  if (typeof target !== 'string' || !target.startsWith('/')) {
    return false;
  }
  return getStorageTargets().includes(target);
};

export default getStorageTargets;
