import { describe, it, expect } from 'vitest';
import { storageLevel } from './storageLevel';

describe('storageLevel', () => {
  it('should switch level exactly at the 75% and 90% thresholds', () => {
    expect(storageLevel(0)).toBe('low');
    expect(storageLevel(74.9)).toBe('low');
    expect(storageLevel(75)).toBe('mid');
    expect(storageLevel(89.9)).toBe('mid');
    expect(storageLevel(90)).toBe('high');
    expect(storageLevel(150)).toBe('high');
  });
});
