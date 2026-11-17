import { describe, expect, it } from '@jest/globals';

import { formatWhen, plural } from '../dates';

describe('formatWhen', () => {
  const now = new Date(2026, 10, 16, 19, 0);

  it('shows yesterday and recent weekdays', () => {
    expect(formatWhen(new Date(2026, 10, 15, 9, 0), now)).toBe('Yesterday');
    expect(formatWhen(new Date(2026, 10, 12, 9, 0), now)).toMatch(/Thursday/);
  });

  it('shows a date for older items, with the year only when it differs', () => {
    expect(formatWhen(new Date(2026, 9, 1), now)).not.toMatch(/2026/);
    expect(formatWhen(new Date(2025, 9, 1), now)).toMatch(/2025/);
  });
});

describe('plural', () => {
  it('adds an s except for one', () => {
    expect(plural(1, 'book')).toBe('1 book');
    expect(plural(0, 'note')).toBe('0 notes');
  });
});
