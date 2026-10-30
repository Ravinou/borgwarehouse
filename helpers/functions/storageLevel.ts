export const STORAGE_WARN_PERCENT = 75;
export const STORAGE_DANGER_PERCENT = 90;

export const STORAGE_LEVEL_COLORS = {
  mid: { bar: '#ff9f1c', hover: '#f08c00' },
  high: { bar: '#ff3d3d', hover: '#e62e2e' },
};

export type StorageLevel = 'low' | 'mid' | 'high';

export function storageLevel(percent: number): StorageLevel {
  if (percent >= STORAGE_DANGER_PERCENT) return 'high';
  if (percent >= STORAGE_WARN_PERCENT) return 'mid';
  return 'low';
}
