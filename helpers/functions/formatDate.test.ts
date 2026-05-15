import { describe, it, expect } from 'vitest';
import { formatDate } from './formatDate';
import { DateFormatEnum } from '~/types';

// Unix timestamp for 2024-01-15 14:30:00 UTC
const TIMESTAMP = 1705329000;

describe('formatDate', () => {
  it('should use toLocaleString when dateFormat is undefined', () => {
    const result = formatDate(TIMESTAMP, undefined);
    expect(result).toBe(new Date(TIMESTAMP * 1000).toLocaleString());
  });

  it('should use toLocaleString when dateFormat is LOCALE', () => {
    const result = formatDate(TIMESTAMP, DateFormatEnum.LOCALE);
    expect(result).toBe(new Date(TIMESTAMP * 1000).toLocaleString());
  });

  it('should format date as ISO (yyyy-MM-dd HH:mm)', () => {
    const result = formatDate(TIMESTAMP, DateFormatEnum.ISO);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('should format date as European (dd/MM/yyyy HH:mm)', () => {
    const result = formatDate(TIMESTAMP, DateFormatEnum.EUROPEAN);
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });

  it('should format date as US (MM/dd/yyyy hh:mm a)', () => {
    const result = formatDate(TIMESTAMP, DateFormatEnum.US);
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2} (AM|PM)$/);
  });
});
