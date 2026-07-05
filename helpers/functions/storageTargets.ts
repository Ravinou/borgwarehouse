// Parse the STORAGE_TARGETS environment variable.
// It holds a comma-separated list of absolute paths, each one an already-mounted
// external storage (e.g. an SSHFS-mounted Hetzner Storage Box) where repositories
// can be stored through a per-repository symbolic link created by BorgWarehouse.
// Example: STORAGE_TARGETS="/mnt/hetzner,/mnt/nas"
export const getStorageTargets = (): string[] => {
  return (process.env.STORAGE_TARGETS ?? '')
    .split(',')
    .map((target) => target.trim())
    .filter((target) => target.length > 0);
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
